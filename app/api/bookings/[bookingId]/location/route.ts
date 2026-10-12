import { auth } from "@/auth";
import { clearTripLocation, recordTripLocation } from "@/lib/domain/trip-safety";

export async function POST(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { bookingId } = await params;
    await recordTripLocation(session.user.id, bookingId, await request.json());
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Location update rejected" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { bookingId } = await params;
    await clearTripLocation(session.user.id, bookingId);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Location update rejected" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
