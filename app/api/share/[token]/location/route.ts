import { getSharedTrip } from "@/lib/domain/trip-safety";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const trip = await getSharedTrip(token);
  if (!trip) return Response.json({ error: "Share link expired" }, { status: 404, headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  const location = trip.location ? { latitude: trip.location.latitude, longitude: trip.location.longitude, accuracyMeters: trip.location.accuracyMeters, recordedAt: trip.location.recordedAt } : null;
  return Response.json({ location }, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
