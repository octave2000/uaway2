"use server"

import { auth } from "@/auth";
import { db } from "@/db";
import { journeys } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function endJourneyAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const journeyId = formData.get("journeyId") as string;
  
  await db.update(journeys).set({
    status: "completed"
  }).where(eq(journeys.id, journeyId));

  redirect(`/dashboard/journeys/${journeyId}/manage`);
}
