"use server";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/roles";
import { reserve } from "@/lib/domain/reservations";
import { limit } from "@/lib/domain/shared";
import { DomainError } from "@/lib/domain/policy";
import { ZodError } from "zod";
export async function bookJourneyAction(formData: FormData) {
  const { userId } = await requireAuthenticatedUser();
  let id: string;
  try {
    await limit(`booking:${userId}`, 10);
    id = await reserve(userId, Object.fromEntries(formData));
  } catch (error) {
    const message =
      error instanceof DomainError
        ? error.message
        : error instanceof ZodError
          ? error.issues[0]?.message
          : null;
    if (!message) throw error;
    redirect(
      `/rides/${encodeURIComponent(String(formData.get("journeyId")))}?error=${encodeURIComponent(message)}`,
    );
  }
  redirect(`/dashboard/bookings/${id}`);
}
