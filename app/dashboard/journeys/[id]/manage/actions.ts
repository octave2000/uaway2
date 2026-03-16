"use server"

import { db } from "@/db";
import { journeys } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";

export async function endJourneyAction(formData: FormData) {
  const { userId } = await requireRole("driver");

  const journeyId = formData.get("journeyId") as string;

  if (!journeyId) {
    redirect("/dashboard/journeys");
  }
  
  await db.update(journeys).set({
    status: "completed"
  }).where(and(eq(journeys.id, journeyId), eq(journeys.driverId, userId)));

  redirect(`/dashboard/journeys/${journeyId}/manage`);
}
