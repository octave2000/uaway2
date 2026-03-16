"use server"

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { bookings, journeys, payoutRequests, reviews, payments } from "@/db/schema";
import { requireRole } from "@/lib/auth/roles";
import { syncFlutterwavePayment } from "@/lib/payments/service";
import { verifyFlutterwaveTransaction } from "@/lib/payments/flutterwave";

function revalidateBookingSurfaces(journeyId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/journeys");

  if (journeyId) {
    revalidatePath(`/dashboard/journeys/${journeyId}`);
    revalidatePath(`/dashboard/journeys/${journeyId}/manage`);
  }
}

export async function checkPaymentStatusAction(formData: FormData) {
  const { userId } = await requireRole("passenger");
  const bookingId = formData.get("bookingId") as string;

  if (!bookingId) {
    redirect("/dashboard/bookings");
  }

  const [bookingRecord] = await db
    .select({
      booking: bookings,
      payment: payments,
    })
    .from(bookings)
    .innerJoin(payments, eq(bookings.id, payments.bookingId))
    .where(and(eq(bookings.id, bookingId), eq(bookings.clientId, userId)))
    .limit(1);

  if (!bookingRecord?.payment.providerTransactionId) {
    redirect("/dashboard/bookings");
  }

  const verification = await verifyFlutterwaveTransaction(
    bookingRecord.payment.providerTransactionId,
  );
  await syncFlutterwavePayment(verification);

  revalidateBookingSurfaces(bookingRecord.booking.journeyId);
  redirect("/dashboard/bookings");
}

export async function requestRideStartAction(formData: FormData) {
  const { userId } = await requireRole("passenger");
  const bookingId = formData.get("bookingId") as string;

  if (!bookingId) {
    redirect("/dashboard/bookings");
  }

  const [bookingRecord] = await db
    .select({
      booking: bookings,
      journey: journeys,
    })
    .from(bookings)
    .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
    .where(and(eq(bookings.id, bookingId), eq(bookings.clientId, userId)))
    .limit(1);

  if (
    !bookingRecord ||
    bookingRecord.booking.status !== "confirmed" ||
    bookingRecord.journey.status !== "active" ||
    bookingRecord.journey.startRequestedAt
  ) {
    redirect("/dashboard/bookings");
  }

  await db
    .update(journeys)
    .set({
      startRequestedByClientId: userId,
      startRequestedAt: new Date(),
    })
    .where(eq(journeys.id, bookingRecord.journey.id));

  revalidateBookingSurfaces(bookingRecord.journey.id);
  redirect("/dashboard/bookings");
}

export async function confirmRideEndAction(formData: FormData) {
  const { userId } = await requireRole("passenger");
  const bookingId = formData.get("bookingId") as string;

  if (!bookingId) {
    redirect("/dashboard/bookings");
  }

  const [bookingRecord] = await db
    .select({
      booking: bookings,
      journey: journeys,
    })
    .from(bookings)
    .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
    .where(and(eq(bookings.id, bookingId), eq(bookings.clientId, userId)))
    .limit(1);

  if (
    !bookingRecord ||
    bookingRecord.booking.status !== "confirmed" ||
    bookingRecord.journey.status !== "ongoing" ||
    !bookingRecord.journey.endRequestedAt
  ) {
    redirect("/dashboard/bookings");
  }

  const completedAt = new Date();

  await db
    .update(journeys)
    .set({
      status: "completed",
      endConfirmedByClientId: userId,
      completedAt,
    })
    .where(eq(journeys.id, bookingRecord.journey.id));

  await db
    .update(bookings)
    .set({
      status: "completed",
      completedAt,
    })
    .where(
      and(
        eq(bookings.journeyId, bookingRecord.journey.id),
        inArray(bookings.status, ["confirmed"]),
      ),
    );

  revalidateBookingSurfaces(bookingRecord.journey.id);
  redirect("/dashboard/bookings");
}

export async function approveAdvancePayoutAction(formData: FormData) {
  const { userId } = await requireRole("passenger");
  const payoutRequestId = formData.get("payoutRequestId") as string;

  if (!payoutRequestId) {
    redirect("/dashboard/bookings");
  }

  await db
    .update(payoutRequests)
    .set({
      status: "approved",
      respondedAt: new Date(),
    })
    .where(
      and(
        eq(payoutRequests.id, payoutRequestId),
        eq(payoutRequests.clientId, userId),
        eq(payoutRequests.type, "advance"),
        eq(payoutRequests.status, "pending"),
      ),
    );

  revalidateBookingSurfaces();
  revalidatePath("/dashboard/payments");
  redirect("/dashboard/bookings");
}

export async function rejectAdvancePayoutAction(formData: FormData) {
  const { userId } = await requireRole("passenger");
  const payoutRequestId = formData.get("payoutRequestId") as string;

  if (!payoutRequestId) {
    redirect("/dashboard/bookings");
  }

  await db
    .update(payoutRequests)
    .set({
      status: "rejected",
      respondedAt: new Date(),
    })
    .where(
      and(
        eq(payoutRequests.id, payoutRequestId),
        eq(payoutRequests.clientId, userId),
        eq(payoutRequests.type, "advance"),
        eq(payoutRequests.status, "pending"),
      ),
    );

  revalidateBookingSurfaces();
  revalidatePath("/dashboard/payments");
  redirect("/dashboard/bookings");
}

export async function submitReviewAction(formData: FormData) {
  const { userId } = await requireRole("passenger");

  const journeyId = formData.get("journeyId") as string;
  const driverId = formData.get("driverId") as string;
  const rating = parseInt(formData.get("rating") as string, 10);
  const comment = formData.get("comment") as string;

  if (!journeyId || !driverId || Number.isNaN(rating) || rating < 1 || rating > 5) {
    redirect("/dashboard/bookings");
  }

  const [completedBooking] = await db
    .select({ journeyId: bookings.journeyId })
    .from(bookings)
    .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
    .where(
      and(
        eq(bookings.clientId, userId),
        eq(bookings.journeyId, journeyId),
        eq(journeys.status, "completed"),
      ),
    )
    .limit(1);

  if (!completedBooking) {
    redirect("/dashboard/bookings");
  }

  const [existingReview] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.clientId, userId), eq(reviews.journeyId, journeyId)))
    .limit(1);

  if (existingReview) {
    redirect("/dashboard/bookings");
  }

  await db.insert(reviews).values({
    clientId: userId,
    journeyId,
    driverId,
    rating,
    comment,
  });

  revalidateBookingSurfaces(journeyId);
}
