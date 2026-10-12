"use server";
import { requireAuthenticatedUser } from "@/lib/auth/roles";
import { runAction } from "@/lib/domain/action";
import { cancelBooking } from "@/lib/domain/reservations";
import { completeBooking, reviewBooking } from "@/lib/domain/rides";
import { createTripShare, raiseEmergencyAlert, revokeTripShares } from "@/lib/domain/trip-safety";
export async function cancelBookingAction(data: FormData) {
  const { userId } = await requireAuthenticatedUser();
  const id = String(data.get("bookingId"));
  await runAction(`/dashboard/bookings/${id}`, () => cancelBooking(userId, id));
}
export async function confirmRideEndAction(data: FormData) {
  const { userId } = await requireAuthenticatedUser();
  const id = String(data.get("bookingId"));
  await runAction(`/dashboard/bookings/${id}`, () =>
    completeBooking(userId, id),
  );
}
export async function submitReviewAction(data: FormData) {
  const { userId } = await requireAuthenticatedUser();
  await runAction(`/dashboard/bookings/${data.get("bookingId")}`, () =>
    reviewBooking(userId, Object.fromEntries(data)),
  );
}
export async function createTripShareAction(bookingId: string) {
  const { userId } = await requireAuthenticatedUser();
  const result = await createTripShare(userId, bookingId);
  return { path: `/share/${result.token}`, expiresAt: result.expiresAt.toISOString() };
}
export async function revokeTripSharesAction(bookingId: string) {
  const { userId } = await requireAuthenticatedUser();
  await revokeTripShares(userId, bookingId);
  return { revoked: true };
}
export async function raiseEmergencyAlertAction(bookingId: string, location?: { latitude: number; longitude: number }) {
  const { userId } = await requireAuthenticatedUser();
  await raiseEmergencyAlert(userId, bookingId, location);
  return { submitted: true };
}
