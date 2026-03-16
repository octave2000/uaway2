"use server"

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { journeys } from "@/db/schema";
import { requireRole } from "@/lib/auth/roles";

function revalidateJourneySurfaces(journeyId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/journeys");
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard/payments");
  revalidatePath(`/dashboard/journeys/${journeyId}`);
  revalidatePath(`/dashboard/journeys/${journeyId}/manage`);
}

export async function confirmRideStartAction(formData: FormData) {
  const { userId } = await requireRole("driver");
  const journeyId = formData.get("journeyId") as string;

  if (!journeyId) {
    redirect("/dashboard/journeys");
  }

  const [journey] = await db
    .select()
    .from(journeys)
    .where(and(eq(journeys.id, journeyId), eq(journeys.driverId, userId)))
    .limit(1);

  if (!journey || journey.status !== "active" || !journey.startRequestedAt) {
    redirect(`/dashboard/journeys/${journeyId}/manage`);
  }

  await db
    .update(journeys)
    .set({
      status: "ongoing",
      startedAt: new Date(),
    })
    .where(eq(journeys.id, journeyId));

  revalidateJourneySurfaces(journeyId);
  redirect(`/dashboard/journeys/${journeyId}/manage`);
}

export async function requestRideEndAction(formData: FormData) {
  const { userId } = await requireRole("driver");
  const journeyId = formData.get("journeyId") as string;

  if (!journeyId) {
    redirect("/dashboard/journeys");
  }

  const [journey] = await db
    .select()
    .from(journeys)
    .where(and(eq(journeys.id, journeyId), eq(journeys.driverId, userId)))
    .limit(1);

  if (!journey || journey.status !== "ongoing") {
    redirect(`/dashboard/journeys/${journeyId}/manage`);
  }

  await db
    .update(journeys)
    .set({
      endRequestedAt: new Date(),
    })
    .where(eq(journeys.id, journeyId));

  revalidateJourneySurfaces(journeyId);
  redirect(`/dashboard/journeys/${journeyId}/manage`);
}
