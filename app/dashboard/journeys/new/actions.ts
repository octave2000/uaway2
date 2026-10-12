"use server";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireRole } from "@/lib/auth/roles";
import { publishJourney } from "@/lib/domain/journeys";
import { DomainError } from "@/lib/domain/policy";
export async function postJourneyAction(data: FormData) {
  const { userId } = await requireRole("driver");
  let id: string;
  try {
    id = await publishJourney(userId, Object.fromEntries(data));
  } catch (e) {
    if (e instanceof DomainError || e instanceof ZodError)
      redirect(
        `/dashboard/journeys/new?error=${encodeURIComponent(e instanceof DomainError ? e.message : e.issues[0].message)}`,
      );
    throw e;
  }
  redirect(`/dashboard/journeys/${id}/manage`);
}
