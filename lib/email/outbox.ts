import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { bookings, cars, journeys, outbox, payments, users } from "@/db/schema";
import {
  bookingConfirmedEmail,
  notificationEmail,
  receiptEmail,
  thankYouEmail,
  type Email,
} from "./templates";

const drivers = alias(users, "drivers");

async function loadBooking(bookingId: string) {
  const [row] = await db
    .select({ booking: bookings, journey: journeys, car: cars, driver: drivers })
    .from(bookings)
    .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
    .innerJoin(cars, eq(journeys.carId, cars.id))
    .innerJoin(drivers, eq(journeys.driverId, drivers.id))
    .where(eq(bookings.id, bookingId));
  return row;
}

// Outbox keys are `<kind>:<id>`. Kinds with richer context get a dedicated
// template; everything else is sent as a generic notification.
export async function renderOutboxEmail(
  event: typeof outbox.$inferSelect,
  recipientName: string | null,
): Promise<Email> {
  const url = new URL(event.href, process.env.APP_URL).toString();
  const split = event.key.indexOf(":");
  const kind = event.key.slice(0, split);
  const id = event.key.slice(split + 1);
  if (kind === "confirmed") {
    const row = await loadBooking(id);
    if (row)
      return bookingConfirmedEmail({
        name: recipientName,
        code: row.booking.bookingCode,
        trip: row.journey,
        seats: row.booking.seatsBooked,
        luggage: row.booking.luggageSpace,
        pickupInstructions: row.journey.pickupInstructions,
        driverName: row.driver.name,
        vehicle: `${row.car.name} · ${row.car.plateNumber}`,
        url,
      });
  }
  if (kind === "completed") {
    const row = await loadBooking(id);
    if (row)
      return thankYouEmail({
        name: recipientName,
        trip: row.journey,
        driverName: row.driver.name,
        url,
      });
  }
  if (kind === "receipt") {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id));
    const row = payment && (await loadBooking(payment.bookingId));
    if (row)
      return receiptEmail({
        name: recipientName,
        receiptNo: `UA-${payment.id.slice(0, 8).toUpperCase()}`,
        paidAt: payment.paidAt ?? event.createdAt,
        bookingCode: row.booking.bookingCode,
        trip: row.journey,
        seats: row.booking.seatsBooked,
        fareMinor: row.booking.fareMinor,
        feeMinor: row.booking.feeMinor,
        amountMinor: payment.amountMinor,
        method: payment.paymentMethod,
        phone: payment.phoneNumber,
        transactionId: payment.providerTransactionId,
        url,
      });
  }
  return notificationEmail(event.title, event.body, url);
}
