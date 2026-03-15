"use server"

import { auth } from "@/auth";
import { db } from "@/db";
import { reviews } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function submitReviewAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const journeyId = formData.get("journeyId") as string;
  const driverId = formData.get("driverId") as string;
  const rating = parseInt(formData.get("rating") as string, 10);
  const comment = formData.get("comment") as string;

  await db.insert(reviews).values({
    clientId: session.user.id,
    journeyId,
    driverId,
    rating,
    comment,
  });

  revalidatePath("/dashboard/bookings");
}
