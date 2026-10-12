import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, journeys, reviews, supportCases, tripLocations } from "@/db/schema";
import { z } from "zod";
import { lockBooking } from "./reservations";
import { DomainError } from "./policy";
import { audit, notify, limit } from "./shared";

export async function board(driverId: string, bookingId: string, code: string) {
  await limit(`boarding:${driverId}`, 20);
  const result = await db.transaction(async (tx) => {
    const { booking, journey } = await lockBooking(tx, bookingId);
    if (journey.driverId !== driverId)
      throw new DomainError("forbidden", "Booking not found.");
    if (booking.boardedAt) return;
    if (booking.status !== "confirmed" || journey.status !== "active")
      throw new DomainError("state", "This booking cannot be boarded.");
    if (booking.boardingAttempts >= 5)
      throw new DomainError(
        "attempts",
        "Too many code attempts. Contact support.",
      );
    if (booking.bookingCode !== code.trim().toUpperCase()) {
      await tx
        .update(bookings)
        .set({ boardingAttempts: booking.boardingAttempts + 1 })
        .where(eq(bookings.id, bookingId));
      return "The boarding code does not match.";
    }
    await tx
      .update(bookings)
      .set({ boardedAt: new Date() })
      .where(eq(bookings.id, bookingId));
    await audit(tx, driverId, "booking.boarded", bookingId);
    await notify(
      tx,
      `boarded:${bookingId}`,
      booking.clientId,
      "You are checked in",
      "Your driver has confirmed your boarding code.",
      `/dashboard/bookings/${bookingId}`,
    );
  });
  if (result) throw new DomainError("code", result);
}
export async function changeJourney(
  driverId: string,
  journeyId: string,
  command: "start" | "end",
) {
  await db.transaction(async (tx) => {
    const [journey] = await tx
      .select()
      .from(journeys)
      .where(eq(journeys.id, journeyId))
      .for("update");
    if (!journey || journey.driverId !== driverId)
      throw new DomainError("forbidden", "Journey not found.");
    const passengers = await tx
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.journeyId, journeyId),
          eq(bookings.status, "confirmed"),
        ),
      );
    if (command === "start") {
      if (journey.status !== "active" || !passengers.some((b) => b.boardedAt))
        throw new DomainError(
          "boarding",
          "Check in at least one passenger before starting.",
        );
      if (journey.departureTime.getTime() > Date.now() + 30 * 60000)
        throw new DomainError(
          "early",
          "You can start within 30 minutes of departure.",
        );
      if (passengers.some((b) => !b.boardedAt))
        throw new DomainError(
          "boarding",
          "Check in all confirmed passengers or contact support about a no-show.",
        );
      await tx
        .update(journeys)
        .set({ status: "ongoing", startedAt: new Date() })
        .where(eq(journeys.id, journeyId));
    } else {
      if (journey.status !== "ongoing")
        throw new DomainError("state", "This journey is not ongoing.");
      if (journey.endRequestedAt) return;
      await tx
        .update(journeys)
        .set({ endRequestedAt: new Date() })
        .where(eq(journeys.id, journeyId));
    }
    for (const b of passengers)
      await notify(
        tx,
        `${command}:${b.id}`,
        b.clientId,
        command === "start" ? "Your ride has started" : "Confirm your arrival",
        command === "start"
          ? "Have a safe journey. Your booking includes support contact options."
          : "Your driver has ended the journey. Confirm your own arrival or report a problem.",
        `/dashboard/bookings/${b.id}`,
      );
    await audit(tx, driverId, `journey.${command}`, journeyId);
  });
}
export async function completeBooking(userId: string, bookingId: string) {
  await db.transaction(async (tx) => {
    const { booking, journey } = await lockBooking(tx, bookingId);
    if (booking.clientId !== userId)
      throw new DomainError("forbidden", "Booking not found.");
    if (booking.status === "completed") return;
    if (
      booking.status !== "confirmed" ||
      !booking.boardedAt ||
      journey.status !== "ongoing" ||
      !journey.endRequestedAt
    )
      throw new DomainError("state", "Arrival cannot be confirmed yet.");
    const now = new Date();
    await tx
      .update(bookings)
      .set({ status: "completed", completedAt: now })
      .where(eq(bookings.id, bookingId));
    await tx.delete(tripLocations).where(eq(tripLocations.bookingId, bookingId));
    const remaining = await tx
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.journeyId, journey.id),
          eq(bookings.status, "confirmed"),
        ),
      );
    if (!remaining.length)
      await tx
        .update(journeys)
        .set({ status: "completed", completedAt: now })
        .where(eq(journeys.id, journey.id));
    await notify(
      tx,
      `completed:${bookingId}`,
      userId,
      "Thanks for travelling with Uaway",
      "You can now review your driver. Report any problem before settlement.",
      `/dashboard/bookings/${bookingId}`,
    );
    await audit(tx, userId, "booking.completed", bookingId);
  });
}
export async function reviewBooking(userId: string, data: unknown) {
  const input = z
    .object({
      bookingId: z.string().uuid(),
      rating: z.coerce.number().int().min(1).max(5),
      comment: z.string().trim().max(1000),
      authorRole: z.enum(["passenger", "driver"]).default("passenger"),
    })
    .parse(data);
  await db.transaction(async (tx) => {
    const { booking, journey } = await lockBooking(tx, input.bookingId);
    const isPassengerReview = input.authorRole === "passenger" && booking.clientId === userId;
    const isDriverReview = input.authorRole === "driver" && journey.driverId === userId;
    if ((!isPassengerReview && !isDriverReview) || booking.status !== "completed")
      throw new DomainError(
        "review",
        "Only a rider involved in this completed booking can leave this review.",
      );
    await tx
      .insert(reviews)
      .values({
        clientId: userId,
        journeyId: journey.id,
        driverId: journey.driverId,
        rating: input.rating,
        comment: input.comment,
        authorRole: input.authorRole,
      })
      .onConflictDoNothing();
  });
}
export async function openSupport(userId: string, data: unknown) {
  const input = z
    .object({
      bookingId: z.string().uuid().optional(),
      subject: z.string().trim().min(3).max(120),
      message: z.string().trim().min(10).max(4000),
    })
    .parse(data);
  await limit(`support:${userId}`, 5, 3600000);
  await db.transaction(async (tx) => {
    if (input.bookingId) {
      const { booking, journey } = await lockBooking(tx, input.bookingId);
      if (booking.clientId !== userId && journey.driverId !== userId)
        throw new DomainError("forbidden", "Booking not found.");
      await tx
        .update(bookings)
        .set({ disputedAt: new Date() })
        .where(eq(bookings.id, booking.id));
    }
    const [ticket] = await tx
      .insert(supportCases)
      .values({ ...input, userId })
      .returning();
    await notify(
      tx,
      `support:${ticket.id}`,
      userId,
      "Support request received",
      "Your request is open. Any unsettled payment for the booking is on hold while we review it.",
      "/dashboard/support",
    );
    await audit(tx, userId, "support.opened", ticket.id);
  });
}
