"use server";
import { requireRole } from "@/lib/auth/roles";
import { runAction } from "@/lib/domain/action";
import { board, changeJourney, reviewBooking } from "@/lib/domain/rides";
import { cancelJourney } from "@/lib/domain/journeys";
export async function confirmRideStartAction(data: FormData) {
  const { userId } = await requireRole("driver");
  const id = String(data.get("journeyId"));
  await runAction(`/dashboard/journeys/${id}/manage`, () =>
    changeJourney(userId, id, "start"),
  );
}
export async function requestRideEndAction(data: FormData) {
  const { userId } = await requireRole("driver");
  const id = String(data.get("journeyId"));
  await runAction(`/dashboard/journeys/${id}/manage`, () =>
    changeJourney(userId, id, "end"),
  );
}
export async function boardAction(data: FormData) {
  const { userId } = await requireRole("driver");
  await runAction(`/dashboard/journeys/${data.get("journeyId")}/manage`, () =>
    board(userId, String(data.get("bookingId")), String(data.get("code"))),
  );
}
export async function cancelJourneyAction(data: FormData) {
  const { userId } = await requireRole("driver");
  const id = String(data.get("journeyId"));
  await runAction(`/dashboard/journeys/${id}/manage`, () =>
    cancelJourney(userId, id),
  );
}
export async function submitPassengerReviewAction(data: FormData) {
  const { userId } = await requireRole("driver");
  const id = String(data.get("journeyId"));
  await runAction(`/dashboard/journeys/${id}/manage`, () =>
    reviewBooking(userId, Object.fromEntries(data)),
  );
}
