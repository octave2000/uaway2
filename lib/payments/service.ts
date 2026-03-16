import { and, eq, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { bookings, journeys, payments } from "@/db/schema";
import type { FlutterwaveVerificationResponse } from "@/lib/payments/flutterwave";

export async function syncFlutterwavePayment(
  verification: FlutterwaveVerificationResponse,
): Promise<"success" | "failed" | "missing"> {
  const [paymentRecord] = await db
    .select({
      payment: payments,
      booking: bookings,
    })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .where(
      or(
        eq(payments.txRef, verification.tx_ref),
        eq(payments.providerTransactionId, String(verification.id)),
      ),
    )
    .limit(1);

  if (!paymentRecord) {
    return "missing";
  }

  const verifiedAt = new Date();
  const providerTransactionId = String(verification.id);
  const wasSuccessful =
    verification.status === "successful" || verification.status === "success";

  await db.transaction(async (tx) => {
    await tx
      .update(payments)
      .set({
        status: wasSuccessful ? "success" : "failed",
        currency: verification.currency,
        paymentMethod: verification.payment_type.toLowerCase(),
        phoneNumber: verification.customer.phone_number,
        providerTransactionId,
        providerStatus: verification.status,
        reference: verification.flw_ref,
        paidAt: wasSuccessful ? verifiedAt : null,
        verifiedAt,
      })
      .where(eq(payments.id, paymentRecord.payment.id));

    if (!wasSuccessful) {
      await tx
        .update(bookings)
        .set({
          status: "payment_failed",
        })
        .where(eq(bookings.id, paymentRecord.booking.id));

      return;
    }

    if (paymentRecord.booking.status === "confirmed") {
      return;
    }

    await tx
      .update(bookings)
      .set({
        status: "confirmed",
        confirmedAt: verifiedAt,
      })
      .where(eq(bookings.id, paymentRecord.booking.id));

    await tx
      .update(journeys)
      .set({
        seatsAvailable: sql`${journeys.seatsAvailable} - ${paymentRecord.booking.seatsBooked}`,
        luggageCapacity: sql`${journeys.luggageCapacity} - ${paymentRecord.booking.luggageSpace}`,
      })
      .where(
        and(
          eq(journeys.id, paymentRecord.booking.journeyId),
          eq(journeys.status, "active"),
        ),
      );
  });

  return wasSuccessful ? "success" : "failed";
}
