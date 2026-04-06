import { and, eq, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { bookings, journeys, payments } from "@/db/schema";
import {
  type DarajaStkCallback,
  type DarajaStkQueryResponse,
  getDarajaCallbackMetadataValue,
} from "@/lib/payments/daraja";

type DarajaSyncResult = "success" | "failed" | "missing";

type DarajaNormalizedResult = {
  checkoutRequestId: string;
  merchantRequestId?: string;
  resultCode: number;
  resultDesc: string;
  amount?: number;
  phoneNumber?: string;
  receipt?: string;
  transactionDate?: Date | null;
};

function parseDarajaDate(value?: string | number): Date | null {
  if (!value) {
    return null;
  }

  const raw = String(value);
  if (!/^\d{14}$/.test(raw)) {
    return null;
  }

  const year = Number(raw.slice(0, 4));
  const month = Number(raw.slice(4, 6));
  const day = Number(raw.slice(6, 8));
  const hour = Number(raw.slice(8, 10));
  const minute = Number(raw.slice(10, 12));
  const second = Number(raw.slice(12, 14));

  if ([year, month, day, hour, minute, second].some((part) => Number.isNaN(part))) {
    return null;
  }

  return new Date(year, month - 1, day, hour, minute, second);
}

function normalizeDarajaResultFromCallback(
  callback: DarajaStkCallback,
): DarajaNormalizedResult {
  return {
    checkoutRequestId: callback.CheckoutRequestID,
    merchantRequestId: callback.MerchantRequestID,
    resultCode: Number(callback.ResultCode),
    resultDesc: callback.ResultDesc,
    amount: Number(getDarajaCallbackMetadataValue(callback, "Amount")),
    phoneNumber: String(getDarajaCallbackMetadataValue(callback, "PhoneNumber") ?? ""),
    receipt: String(getDarajaCallbackMetadataValue(callback, "MpesaReceiptNumber") ?? ""),
    transactionDate: parseDarajaDate(getDarajaCallbackMetadataValue(callback, "TransactionDate")),
  };
}

function normalizeDarajaResultFromQuery(
  query: DarajaStkQueryResponse,
): DarajaNormalizedResult {
  return {
    checkoutRequestId: query.CheckoutRequestID,
    merchantRequestId: query.MerchantRequestID,
    resultCode: Number(query.ResultCode),
    resultDesc: query.ResultDesc,
  };
}

async function syncDarajaPayment(
  normalized: DarajaNormalizedResult,
): Promise<DarajaSyncResult> {
  const matchConditions = [eq(payments.providerTransactionId, normalized.checkoutRequestId)];
  if (normalized.merchantRequestId) {
    matchConditions.push(eq(payments.checkoutUrl, normalized.merchantRequestId));
  }

  const [paymentRecord] = await db
    .select({
      payment: payments,
      booking: bookings,
    })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .where(matchConditions.length === 1 ? matchConditions[0] : or(...matchConditions))
    .limit(1);

  if (!paymentRecord) {
    return "missing";
  }

  const verifiedAt = new Date();
  const wasSuccessful = normalized.resultCode === 0;
  const paidAt = wasSuccessful ? normalized.transactionDate ?? verifiedAt : null;
  const reference =
    normalized.receipt && normalized.receipt !== "undefined" ? normalized.receipt : undefined;

  await db.transaction(async (tx) => {
    await tx
      .update(payments)
      .set({
        status: wasSuccessful ? "success" : "failed",
        currency: "KES",
        paymentMethod: "mpesa",
        phoneNumber: normalized.phoneNumber || paymentRecord.payment.phoneNumber,
        providerTransactionId: normalized.checkoutRequestId,
        providerStatus: normalized.resultDesc,
        reference: reference ?? paymentRecord.payment.reference,
        checkoutUrl: normalized.merchantRequestId ?? paymentRecord.payment.checkoutUrl,
        paidAt,
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

export async function syncDarajaPaymentFromCallback(
  callback: DarajaStkCallback,
): Promise<DarajaSyncResult> {
  return syncDarajaPayment(normalizeDarajaResultFromCallback(callback));
}

export async function syncDarajaPaymentFromQuery(
  query: DarajaStkQueryResponse,
): Promise<DarajaSyncResult> {
  return syncDarajaPayment(normalizeDarajaResultFromQuery(query));
}
