import { and, eq, lte, inArray, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import {
  bookings,
  payments,
  ledgerEntries,
  providerEvents,
  supportCases,
} from "@/db/schema";
import {
  createDarajaStkPush,
  queryDarajaStkPush,
  type DarajaStkQueryResponse,
} from "./daraja";
import {
  lockBooking,
  queueRefund,
  releaseInventory,
} from "@/lib/domain/reservations";
import { paymentOutcome } from "@/lib/domain/policy";
import { audit, notify } from "@/lib/domain/shared";

// Only call with the result of our authenticated provider query, never callback JSON.
export async function syncDarajaPaymentFromQuery(
  query: DarajaStkQueryResponse,
) {
  const [ref] = await db
    .select()
    .from(payments)
    .where(eq(payments.providerTransactionId, query.CheckoutRequestID));
  if (
    !ref ||
    ref.provider !== "daraja" ||
    ref.checkoutUrl !== query.MerchantRequestID
  )
    return "missing";
  return db.transaction(async (tx) => {
    const { booking, journey } = await lockBooking(tx, ref.bookingId);
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, ref.id))
      .for("update");
    const outcome = paymentOutcome(
      payment.status,
      query.ResultCode === undefined ? undefined : Number(query.ResultCode),
    );
    if (outcome === "unchanged" || outcome === "pending") return outcome;
    const now = new Date();
    await tx
      .update(payments)
      .set({
        status: outcome,
        paidAt: outcome === "success" ? now : null,
        verifiedAt: now,
        providerStatus: query.ResultDesc,
      })
      .where(eq(payments.id, payment.id));
    if (outcome === "failed") {
      if (booking.status === "payment_pending") {
        await releaseInventory(tx, booking);
        await tx
          .update(bookings)
          .set({ status: "payment_failed" })
          .where(eq(bookings.id, booking.id));
        await notify(
          tx,
          `failed:${payment.id}`,
          booking.clientId,
          "Payment not completed",
          "Your seats have been released. You can start a new booking.",
          `/dashboard/bookings/${booking.id}`,
        );
      }
      return outcome;
    }
    await tx
      .insert(ledgerEntries)
      .values({
        key: `collection:${payment.id}`,
        paymentId: payment.id,
        debit: "mpesa_clearing",
        credit: "passenger_funds",
        amountMinor: payment.amountMinor,
      })
      .onConflictDoNothing();
    if (
      booking.status !== "payment_pending" ||
      !booking.inventoryHeld ||
      !booking.expiresAt ||
      booking.expiresAt <= now ||
      journey.status !== "active" ||
      journey.departureTime <= now
    ) {
      await releaseInventory(tx, booking);
      await tx
        .update(bookings)
        .set({ status: "cancelled" })
        .where(eq(bookings.id, booking.id));
      await queueRefund(tx, payment, "Payment arrived after reservation ended");
      await notify(
        tx,
        `late:${payment.id}`,
        booking.clientId,
        "Payment received — refund pending",
        "Your reservation ended before payment was confirmed. Your full payment will be refunded.",
        `/dashboard/bookings/${booking.id}`,
      );
      return "refund_pending";
    }
    await tx
      .update(bookings)
      .set({ status: "confirmed", confirmedAt: now })
      .where(eq(bookings.id, booking.id));
    await notify(
      tx,
      `confirmed:${booking.id}`,
      booking.clientId,
      "Your ride is booked",
      "Payment confirmed. Your boarding code and pickup details are ready.",
      `/dashboard/bookings/${booking.id}`,
    );
    await notify(
      tx,
      `passenger:${booking.id}`,
      journey.driverId,
      "New passenger",
      "A passenger has booked your journey.",
      `/dashboard/journeys/${journey.id}/manage`,
    );
    await audit(tx, null, "payment.verified", payment.id, {
      amountMinor: payment.amountMinor,
      checkoutId: query.CheckoutRequestID,
    });
    return outcome;
  });
}
export async function initiatePayment(paymentId: string) {
  const claimed = await db.transaction(async (tx) => {
    const [ref] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId));
    if (!ref) return;
    const { booking } = await lockBooking(tx, ref.bookingId);
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .for("update");
    if (
      payment.providerStatus !== "queued" ||
      booking.status !== "payment_pending" ||
      !booking.expiresAt ||
      booking.expiresAt <= new Date()
    )
      return;
    await tx
      .update(payments)
      .set({ providerStatus: "initiating" })
      .where(eq(payments.id, payment.id));
    return { payment, booking };
  });
  if (!claimed) return;
  try {
    const charge = await createDarajaStkPush({
      amount: claimed.payment.amountMinor / 100,
      phoneNumber: claimed.payment.phoneNumber!,
      accountReference: claimed.booking.bookingCode,
      transactionDesc: "Uaway ride booking",
    });
    await db
      .update(payments)
      .set({
        providerTransactionId: charge.CheckoutRequestID,
        checkoutUrl: charge.MerchantRequestID,
        providerStatus: "awaiting_customer",
        nextCheckAt: new Date(Date.now() + 15000),
      })
      .where(eq(payments.id, paymentId));
  } catch {
    // A timeout may mean the provider accepted the charge. Never automatically charge again.
    await db.transaction(async (tx) => {
      await tx
        .update(payments)
        .set({ providerStatus: "initiation_unknown" })
        .where(eq(payments.id, paymentId));
      await tx.insert(supportCases).values({
        userId: claimed.booking.clientId,
        bookingId: claimed.booking.id,
        subject: "Payment initiation needs reconciliation",
        message: `Payment ${paymentId} has an unknown provider outcome. Check the merchant statement before retrying or refunding.`,
      });
      await notify(
        tx,
        `unknown:${paymentId}`,
        claimed.booking.clientId,
        "Payment needs a check",
        "We could not confirm the payment request. Please do not pay again until support has checked it.",
        `/dashboard/bookings/${claimed.booking.id}`,
      );
    });
  }
}
export async function reconcilePayments() {
  const queued = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.status, "pending"),
        eq(payments.providerStatus, "queued"),
      ),
    )
    .limit(25);
  for (const payment of queued) await initiatePayment(payment.id);
  const pending = await db
    .select()
    .from(payments)
    .where(
      and(
        inArray(payments.status, ["pending", "failed"]),
        isNotNull(payments.providerTransactionId),
        lte(payments.nextCheckAt, new Date()),
      ),
    )
    .limit(50);
  for (const payment of pending) {
    if (!payment.providerTransactionId) continue;
    // Claim a query interval so UI polling and multiple workers cannot hammer Daraja.
    const [claimed] = await db
      .update(payments)
      .set({ nextCheckAt: new Date(Date.now() + 120000) })
      .where(
        and(eq(payments.id, payment.id), lte(payments.nextCheckAt, new Date())),
      )
      .returning();
    if (!claimed) continue;
    try {
      const result = await queryDarajaStkPush(payment.providerTransactionId);
      if (result.CheckoutRequestID !== payment.providerTransactionId)
        throw new Error("Provider reference mismatch");
      await syncDarajaPaymentFromQuery(result);
      await db
        .update(providerEvents)
        .set({ processedAt: new Date() })
        .where(eq(providerEvents.checkoutId, result.CheckoutRequestID));
    } catch {
      console.error(
        JSON.stringify({
          event: "payment.reconciliation_failed",
          paymentId: payment.id,
        }),
      );
    }
  }
}
