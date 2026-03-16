"use server"

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { bookings, journeys, payments, payoutRequests } from "@/db/schema";
import { requireRole } from "@/lib/auth/roles";

const PAYOUT_RELEASE_DELAY_MS = 6 * 60 * 60 * 1000;

function revalidatePaymentSurfaces(journeyId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/payments");

  if (journeyId) {
    revalidatePath(`/dashboard/journeys/${journeyId}/manage`);
  }
}

export async function requestStandardPayoutAction(formData: FormData) {
  const { userId } = await requireRole("driver");
  const paymentId = formData.get("paymentId") as string;

  if (!paymentId) {
    redirect("/dashboard/payments");
  }

  const [paymentRecord] = await db
    .select({
      payment: payments,
      booking: bookings,
      journey: journeys,
    })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
    .where(and(eq(payments.id, paymentId), eq(journeys.driverId, userId)))
    .limit(1);

  if (
    !paymentRecord ||
    paymentRecord.payment.status !== "success" ||
    paymentRecord.journey.status !== "completed" ||
    Date.now() - (paymentRecord.payment.paidAt?.getTime() ?? paymentRecord.payment.createdAt?.getTime() ?? 0) <
      PAYOUT_RELEASE_DELAY_MS
  ) {
    redirect("/dashboard/payments");
  }

  const [existingRequest] = await db
    .select({ id: payoutRequests.id })
    .from(payoutRequests)
    .where(
      and(
        eq(payoutRequests.paymentId, paymentId),
        eq(payoutRequests.type, "standard"),
        inArray(payoutRequests.status, ["pending", "approved", "paid"]),
      ),
    )
    .limit(1);

  if (!existingRequest) {
    await db.insert(payoutRequests).values({
      paymentId,
      bookingId: paymentRecord.booking.id,
      driverId: userId,
      clientId: paymentRecord.booking.clientId,
      amount: paymentRecord.payment.amount,
      type: "standard",
      status: "approved",
      note: "Eligible standard payout request created after the 6-hour release window.",
      respondedAt: new Date(),
    });
  }

  revalidatePaymentSurfaces(paymentRecord.journey.id);
  redirect("/dashboard/payments");
}

export async function requestAdvancePayoutAction(formData: FormData) {
  const { userId } = await requireRole("driver");
  const paymentId = formData.get("paymentId") as string;

  if (!paymentId) {
    redirect("/dashboard/payments");
  }

  const [paymentRecord] = await db
    .select({
      payment: payments,
      booking: bookings,
      journey: journeys,
    })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
    .where(and(eq(payments.id, paymentId), eq(journeys.driverId, userId)))
    .limit(1);

  if (
    !paymentRecord ||
    paymentRecord.payment.status !== "success" ||
    paymentRecord.booking.status !== "confirmed" ||
    paymentRecord.journey.status !== "ongoing"
  ) {
    redirect("/dashboard/payments");
  }

  const [existingRequest] = await db
    .select({ id: payoutRequests.id })
    .from(payoutRequests)
    .where(
      and(
        eq(payoutRequests.paymentId, paymentId),
        eq(payoutRequests.type, "advance"),
        inArray(payoutRequests.status, ["pending", "approved", "paid"]),
      ),
    )
    .limit(1);

  if (!existingRequest) {
    await db.insert(payoutRequests).values({
      paymentId,
      bookingId: paymentRecord.booking.id,
      driverId: userId,
      clientId: paymentRecord.booking.clientId,
      amount: paymentRecord.payment.amount,
      type: "advance",
      status: "pending",
      note: "Driver requested an advance payout while the ride is still ongoing.",
    });
  }

  revalidatePaymentSurfaces(paymentRecord.journey.id);
  redirect("/dashboard/payments");
}
