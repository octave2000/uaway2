import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { cars, journeys, bookings, payments, tripLocations } from "@/db/schema";
import { DomainError, parseNairobiDate } from "./policy";
import { eligible, audit, notify } from "./shared";
import { meetingPoint, normalizePlace, placeKey } from "./locations";
import { releaseInventory, queueRefund } from "./reservations";
const schema = z.object({
  carId: z.string().uuid(),
  origin: z.string().trim().min(2).max(100),
  destination: z.string().trim().min(2).max(100),
  departureTime: z.string(),
  seatsAvailable: z.coerce.number().int().min(1).max(8),
  luggageCapacity: z.coerce.number().int().min(0).max(200),
  pricePerSeat: z.coerce.number().int().min(50).max(100000),
  note: z.string().trim().max(1000).default(""),
  pickupInstructions: z.string().trim().max(300).default(""),
  dropoffInstructions: z.string().trim().max(300).default(""),
});
export async function publishJourney(driverId: string, input: unknown) {
  const data = schema.parse(input);
  const departureTime = parseNairobiDate(data.departureTime);
  const origin = normalizePlace(data.origin);
  const destination = normalizePlace(data.destination);
  if (placeKey(origin) === placeKey(destination))
    throw new DomainError(
      "route",
      "Choose two different towns or places for this route.",
    );
  if (departureTime <= new Date())
    throw new DomainError("date", "Choose a future departure time.");
  return db.transaction(async (tx) => {
    await eligible(tx, driverId);
    const [car] = await tx
      .select()
      .from(cars)
      .where(and(eq(cars.id, data.carId), eq(cars.driverId, driverId)))
      .for("update");
    if (!car?.verified)
      throw new DomainError("vehicle", "Choose an approved vehicle.");
    if (
      data.seatsAvailable > car.seats ||
      data.luggageCapacity > car.luggageCapacity
    )
      throw new DomainError(
        "capacity",
        "Capacity cannot exceed your vehicle capacity.",
      );
    const [journey] = await tx
      .insert(journeys)
      .values({
        ...data,
        origin,
        destination,
        driverId,
        departureTime,
        pickupInstructions:
          data.pickupInstructions || meetingPoint(origin)?.point || "",
        dropoffInstructions:
          data.dropoffInstructions || meetingPoint(destination)?.point || "",
      })
      .returning();
    await audit(tx, driverId, "journey.published", journey.id);
    return journey.id;
  });
}
export async function cancelJourney(driverId: string, id: string) {
  await db.transaction(async (tx) => {
    const [journey] = await tx
      .select()
      .from(journeys)
      .where(eq(journeys.id, id))
      .for("update");
    if (!journey || journey.driverId !== driverId)
      throw new DomainError("missing", "Journey not found.");
    if (journey.status === "cancelled") return;
    if (journey.status !== "active" || journey.departureTime <= new Date())
      throw new DomainError(
        "departed",
        "Contact support to cancel a departed journey.",
      );
    await tx
      .update(journeys)
      .set({ status: "cancelled" })
      .where(eq(journeys.id, id));
    const passengers = await tx
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.journeyId, id),
          inArray(bookings.status, ["payment_pending", "confirmed"]),
        ),
      )
      .for("update");
    for (const booking of passengers) {
      await releaseInventory(tx, booking);
      await tx
        .update(bookings)
        .set({ status: "cancelled" })
        .where(eq(bookings.id, booking.id));
      await tx.delete(tripLocations).where(eq(tripLocations.bookingId, booking.id));
      const paid = await tx
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.bookingId, booking.id),
            eq(payments.status, "success"),
          ),
        )
        .for("update");
      for (const payment of paid)
        await queueRefund(tx, payment, "Driver cancelled the journey");
      await notify(
        tx,
        `driver-cancel:${booking.id}`,
        booking.clientId,
        "Your driver cancelled",
        "Your journey was cancelled. Any successful payment will be refunded in full.",
        `/dashboard/bookings/${booking.id}`,
      );
    }
    await audit(tx, driverId, "journey.cancelled", id);
  });
}
