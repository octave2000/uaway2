import { and, eq, inArray, lte } from "drizzle-orm";

import { db } from "@/db";
import { bookings, journeys } from "@/db/schema";

const AUTO_COMPLETE_AFTER_HOURS = 24;

export async function autoCompleteExpiredJourneys(): Promise<string[]> {
  const completionThreshold = new Date(
    Date.now() - AUTO_COMPLETE_AFTER_HOURS * 60 * 60 * 1000,
  );

  const expiredJourneys = await db
    .select({ id: journeys.id })
    .from(journeys)
    .where(
      and(
        eq(journeys.status, "ongoing"),
        lte(journeys.startedAt, completionThreshold),
      ),
    );

  if (expiredJourneys.length === 0) {
    return [];
  }

  const journeyIds = expiredJourneys.map((journey) => journey.id);
  const completedAt = new Date();

  await db
    .update(journeys)
    .set({
      status: "completed",
      completedAt,
      endRequestedAt: completedAt,
    })
    .where(inArray(journeys.id, journeyIds));

  await db
    .update(bookings)
    .set({
      status: "completed",
      completedAt,
    })
    .where(
      and(
        inArray(bookings.journeyId, journeyIds),
        eq(bookings.status, "confirmed"),
      ),
    );

  return journeyIds;
}
