"use server"

import { db } from "@/db";
import { bookings, journeys, reviews } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";

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

  revalidatePath("/dashboard/bookings");
}
