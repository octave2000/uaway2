import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  bookings,
  cars,
  journeys,
  payments,
  refunds,
  tripLocations,
  users,
} from "@/db/schema";
import { bookingInput, DomainError, HOLD_MS } from "./policy";
import { audit, eligible, notify, type Tx } from "./shared";

// Every operation locks journey -> booking -> payment, including worker and callback paths.
export async function lockBooking(tx: Tx, bookingId: string) {
  const [ref] = await tx
    .select({ journeyId: bookings.journeyId })
    .from(bookings)
    .where(eq(bookings.id, bookingId));
  if (!ref) throw new DomainError("missing", "Booking not found.");
  const [journey] = await tx
    .select()
    .from(journeys)
    .where(eq(journeys.id, ref.journeyId))
    .for("update");
  const [booking] = await tx
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .for("update");
  return { booking, journey };
}
export async function releaseInventory(
  tx: Tx,
  booking: typeof bookings.$inferSelect,
) {
  if (!booking.inventoryHeld) return;
  await tx
    .update(journeys)
    .set({
      seatsAvailable: sql`${journeys.seatsAvailable} + ${booking.seatsBooked}`,
      luggageCapacity: sql`${journeys.luggageCapacity} + ${booking.luggageSpace}`,
    })
    .where(eq(journeys.id, booking.journeyId));
  await tx
    .update(bookings)
    .set({ inventoryHeld: false })
    .where(eq(bookings.id, booking.id));
}
export async function queueRefund(
  tx: Tx,
  payment: typeof payments.$inferSelect,
  reason: string,
) {
  await tx
    .insert(refunds)
    .values({ paymentId: payment.id, reason, amountMinor: payment.amountMinor })
    .onConflictDoNothing();
}
export async function reserve(userId: string, input: unknown) {
  const data = bookingInput.parse(input);
  return db.transaction(async (tx) => {
    await eligible(tx, userId);
    const [journey] = await tx
      .select()
      .from(journeys)
      .where(eq(journeys.id, data.journeyId))
      .for("update");
    const [prior] = await tx
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.clientId, userId),
          eq(bookings.idempotencyKey, data.idempotencyKey),
        ),
      );
    if (prior) {
      if (
        prior.journeyId !== data.journeyId ||
        prior.seatsBooked !== data.seatsBooked ||
        prior.luggageSpace !== data.luggageSpace
      )
        throw new DomainError(
          "idempotency",
          "This checkout has already been used. Start a new booking.",
        );
      return prior.id;
    }
    if (
      !journey ||
      journey.driverId === userId ||
      journey.status !== "active" ||
      journey.departureTime <= new Date()
    )
      throw new DomainError(
        "unavailable",
        "This journey is no longer available.",
      );
    const [car] = await tx
      .select()
      .from(cars)
      .where(eq(cars.id, journey.carId))
      .for("update");
    const [driver] = await tx
      .select({ verified: users.verified, suspended: users.suspended })
      .from(users)
      .where(eq(users.id, journey.driverId));
    if (!driver?.verified || driver.suspended)
      throw new DomainError(
        "driver",
        "This driver is no longer available to book.",
      );
    if (!car?.verified)
      throw new DomainError(
        "verification",
        "This vehicle is awaiting approval.",
      );
    const [unknown] = await tx
      .select({ id: payments.id })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .where(
        and(
          eq(bookings.clientId, userId),
          eq(bookings.journeyId, journey.id),
          inArray(payments.providerStatus, [
            "initiating",
            "initiation_unknown",
          ]),
        ),
      );
    if (unknown)
      throw new DomainError(
        "unknown",
        "A previous payment needs reconciliation. Contact support before paying again.",
      );
    const [existing] = await tx
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.clientId, userId),
          eq(bookings.journeyId, journey.id),
          inArray(bookings.status, [
            "payment_pending",
            "confirmed",
            "completed",
          ]),
        ),
      );
    if (existing)
      throw new DomainError(
        "duplicate",
        "You already have a booking for this journey. Open My bookings.",
      );
    if (
      journey.seatsAvailable < data.seatsBooked ||
      journey.luggageCapacity < data.luggageSpace
    )
      throw new DomainError(
        "capacity",
        "Those seats or luggage space are no longer available.",
      );
    const feeMinor = Number(process.env.BOOKING_FEE_KES ?? 0) * 100;
    if (!Number.isSafeInteger(feeMinor) || feeMinor < 0 || feeMinor % 100)
      throw new Error("BOOKING_FEE_KES must be a nonnegative whole KES amount");
    const fareMinor = journey.pricePerSeat * data.seatsBooked * 100;
    const [booking] = await tx
      .insert(bookings)
      .values({
        clientId: userId,
        journeyId: journey.id,
        seatsBooked: data.seatsBooked,
        luggageSpace: data.luggageSpace,
        bookingCode: crypto
          .randomUUID()
          .replaceAll("-", "")
          .slice(0, 10)
          .toUpperCase(),
        idempotencyKey: data.idempotencyKey,
        expiresAt: new Date(
          Math.min(Date.now() + HOLD_MS, journey.departureTime.getTime()),
        ),
        inventoryHeld: true,
        fareMinor,
        feeMinor,
      })
      .returning();
    await tx
      .update(journeys)
      .set({
        seatsAvailable: journey.seatsAvailable - data.seatsBooked,
        luggageCapacity: journey.luggageCapacity - data.luggageSpace,
      })
      .where(eq(journeys.id, journey.id));
    await tx.insert(payments).values({
      bookingId: booking.id,
      amount: (fareMinor + feeMinor) / 100,
      amountMinor: fareMinor + feeMinor,
      txRef: crypto.randomUUID(),
      phoneNumber: data.paymentPhone,
      providerStatus: "queued",
    });
    await notify(
      tx,
      `reserved:${booking.id}`,
      userId,
      "Seats reserved",
      "Your seats are held for up to ten minutes. Approve the M-Pesa prompt on your phone.",
      `/dashboard/bookings/${booking.id}`,
    );
    await audit(tx, userId, "booking.reserved", booking.id);
    return booking.id;
  });
}
export async function cancelBooking(
  userId: string,
  bookingId: string,
  expiry = false,
) {
  return db.transaction(async (tx) => {
    const { booking, journey } = await lockBooking(tx, bookingId);
    if (!expiry && booking.clientId !== userId && journey.driverId !== userId)
      throw new DomainError("forbidden", "Booking not found.");
    if (
      expiry &&
      (booking.status !== "payment_pending" ||
        !booking.expiresAt ||
        booking.expiresAt > new Date())
    )
      return;
    if (["cancelled", "payment_failed"].includes(booking.status)) return;
    if (
      !expiry &&
      (journey.departureTime <= new Date() || journey.status !== "active")
    )
      throw new DomainError(
        "departed",
        "This ride has departed. Contact support for a refund review.",
      );
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
        and(eq(payments.bookingId, booking.id), eq(payments.status, "success")),
      )
      .for("update");
    for (const payment of paid)
      await queueRefund(tx, payment, "Booking cancelled before departure");
    await notify(
      tx,
      `cancelled:${booking.id}`,
      booking.clientId,
      expiry ? "Reservation expired" : "Booking cancelled",
      paid.length
        ? "Your full refund is awaiting processing. Track it in your booking."
        : "Your seats have been released. Any payment received later will be refunded.",
      `/dashboard/bookings/${booking.id}`,
    );
    await audit(
      tx,
      expiry ? null : userId,
      expiry ? "booking.expired" : "booking.cancelled",
      booking.id,
    );
  });
}
