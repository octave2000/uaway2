import { and, eq, inArray, isNotNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  bookings,
  payments,
  payoutRequests,
  refunds,
  ledgerEntries,
} from "@/db/schema";
import { lockBooking, releaseInventory } from "./reservations";
import { canSettle, DomainError } from "./policy";
import { audit, notify } from "./shared";
export async function requestPayout(driverId: string, paymentId: string) {
  await db.transaction(async (tx) => {
    const [ref] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId));
    if (!ref) throw new DomainError("missing", "Payment not found.");
    const { booking, journey } = await lockBooking(tx, ref.bookingId);
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .for("update");
    if (
      journey.driverId !== driverId ||
      payment.status !== "success" ||
      !canSettle(booking)
    )
      throw new DomainError(
        "unavailable",
        "Funds become available six hours after this passenger confirms arrival, if there is no dispute.",
      );
    const [refund] = await tx
      .select()
      .from(refunds)
      .where(eq(refunds.paymentId, paymentId));
    if (refund)
      throw new DomainError("refund", "This payment is allocated to a refund.");
    await tx
      .insert(payoutRequests)
      .values({
        paymentId,
        bookingId: booking.id,
        driverId,
        clientId: booking.clientId,
        amount: booking.fareMinor / 100,
        type: "standard",
        status: "pending",
      })
      .onConflictDoNothing();
    await audit(tx, driverId, "payout.requested", paymentId);
  });
}
export async function recordSettlement(
  adminId: string,
  kind: "refund" | "payout",
  id: string,
  reference: string,
) {
  if (!/^[A-Za-z0-9-]{6,100}$/.test(reference))
    throw new DomainError(
      "reference",
      "Enter the external transaction reference.",
    );
  await db.transaction(async (tx) => {
    const table = kind === "refund" ? refunds : payoutRequests;
    const [ref] = await tx.select().from(table).where(eq(table.id, id));
    if (!ref) throw new DomainError("missing", "Settlement not found.");
    const [payRef] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, ref.paymentId));
    const { booking } = await lockBooking(tx, payRef.bookingId);
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, payRef.id))
      .for("update");
    if (payment.status !== "success")
      throw new DomainError(
        "payment",
        "Payment is not available for settlement.",
      );
    if (kind === "payout") {
      if (!canSettle(booking))
        throw new DomainError("hold", "Booking is not eligible for payout.");
      const [refund] = await tx
        .select()
        .from(refunds)
        .where(eq(refunds.paymentId, payment.id));
      if (refund)
        throw new DomainError("refund", "Payment is allocated to a refund.");
    } else {
      const [payout] = await tx
        .select()
        .from(payoutRequests)
        .where(
          and(
            eq(payoutRequests.paymentId, payment.id),
            or(
              eq(payoutRequests.status, "paid"),
              isNotNull(payoutRequests.externalReference),
            ),
          ),
        );
      if (payout)
        throw new DomainError(
          "payout",
          "A payout has already been executed. Resolve its external outcome first.",
        );
    }
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${reference}, 0))`,
    );
    const existingRefund = await tx
      .select()
      .from(refunds)
      .where(eq(refunds.externalReference, reference));
    const existingPayout = await tx
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.externalReference, reference));
    if (existingRefund.length || existingPayout.length)
      throw new DomainError(
        "reference",
        "This external reference has already been recorded.",
      );
    const [record] = await tx
      .select()
      .from(table)
      .where(eq(table.id, id))
      .for("update");
    if (!record || record.externalReference || record.status !== "pending")
      throw new DomainError("state", "This settlement is no longer pending.");
    await tx
      .update(table)
      .set({ externalReference: reference, recordedBy: adminId })
      .where(eq(table.id, id));
    await audit(tx, adminId, `${kind}.recorded`, id, { reference });
  });
}
export async function reconcileSettlement(
  adminId: string,
  kind: "refund" | "payout",
  id: string,
) {
  await db.transaction(async (tx) => {
    const table = kind === "refund" ? refunds : payoutRequests;
    const [ref] = await tx.select().from(table).where(eq(table.id, id));
    if (!ref) throw new DomainError("missing", "Settlement not found.");
    const [payRef] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, ref.paymentId));
    const { booking, journey } = await lockBooking(tx, payRef.bookingId);
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, payRef.id))
      .for("update");
    const [record] = await tx
      .select()
      .from(table)
      .where(eq(table.id, id))
      .for("update");
    if (record.reconciledBy) return;
    if (!record.externalReference || record.recordedBy === adminId)
      throw new DomainError(
        "review",
        "A different administrator must reconcile against the merchant statement.",
      );
    if (payment.status !== "success")
      throw new DomainError(
        "state",
        "The payment is not available for settlement.",
      );
    if (kind === "payout") {
      if (!canSettle(booking))
        throw new DomainError(
          "dispute",
          "This booking is on hold or not yet eligible.",
        );
      const [refund] = await tx
        .select()
        .from(refunds)
        .where(eq(refunds.paymentId, payment.id));
      if (refund)
        throw new DomainError(
          "refund",
          "This payment has a refund allocation.",
        );
      await tx
        .update(payoutRequests)
        .set({ status: "paid", reconciledBy: adminId, respondedAt: new Date() })
        .where(eq(payoutRequests.id, id));
      await tx.insert(ledgerEntries).values({
        key: `payout:${id}`,
        paymentId: payment.id,
        debit: "passenger_funds",
        credit: "mpesa_clearing",
        amountMinor: booking.fareMinor,
      });
      if (booking.feeMinor)
        await tx.insert(ledgerEntries).values({
          key: `fee:${id}`,
          paymentId: payment.id,
          debit: "passenger_funds",
          credit: "platform_revenue",
          amountMinor: booking.feeMinor,
        });
    } else {
      const existing = await tx
        .select()
        .from(payoutRequests)
        .where(
          and(
            eq(payoutRequests.paymentId, payment.id),
            or(
              inArray(payoutRequests.status, ["approved", "paid"]),
              isNotNull(payoutRequests.externalReference),
            ),
          ),
        );
      if (existing.length)
        throw new DomainError(
          "payout",
          "This payment is already allocated to a payout.",
        );
      await tx
        .update(payoutRequests)
        .set({ status: "rejected" })
        .where(
          and(
            eq(payoutRequests.paymentId, payment.id),
            eq(payoutRequests.status, "pending"),
          ),
        );
      await tx
        .update(refunds)
        .set({ status: "settled", reconciledBy: adminId })
        .where(eq(refunds.id, id));
      await tx
        .update(payments)
        .set({ status: "refunded" })
        .where(eq(payments.id, payment.id));
      await releaseInventory(tx, booking);
      await tx
        .update(bookings)
        .set({ status: "cancelled" })
        .where(eq(bookings.id, booking.id));
      await tx.insert(ledgerEntries).values({
        key: `refund:${id}`,
        paymentId: payment.id,
        debit: "passenger_funds",
        credit: "mpesa_clearing",
        amountMinor: payment.amountMinor,
      });
    }
    await notify(
      tx,
      `settled:${kind}:${id}`,
      kind === "refund" ? booking.clientId : journey.driverId,
      kind === "refund" ? "Refund completed" : "Payout completed",
      `Your transaction reference is ${record.externalReference}.`,
      kind === "refund"
        ? `/dashboard/bookings/${booking.id}`
        : "/dashboard/payments",
    );
    await audit(tx, adminId, `${kind}.reconciled`, id, {
      reference: record.externalReference,
    });
  });
}
