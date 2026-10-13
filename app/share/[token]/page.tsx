import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSharedTrip } from "@/lib/domain/trip-safety";
import { formatDeparture } from "@/lib/domain/policy";
import { TripLocationViewer } from "@/components/rides/trip-location-viewer";
import { BrandLogo } from "@/components/shared/brand-logo";

export const metadata: Metadata = { title: "Shared trip | Uaway", robots: { index: false, follow: false } };

export default async function SharedTrip({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await getSharedTrip(token);
  if (!data) notFound();
  const { journey, car, driver, booking, location, share } = data;
  return <main className="mx-auto max-w-2xl space-y-5 px-4 py-8 sm:py-14">
    <header><div className="flex items-center gap-3"><BrandLogo className="h-14 w-36" /><p className="text-xs font-semibold uppercase tracking-widest text-primary">Shared trip</p></div><h1 className="mt-4 text-2xl font-semibold">{journey.origin} → {journey.destination}</h1><p className="mt-2 text-sm text-muted-foreground">{formatDeparture(journey.departureTime)} · EAT</p></header>
    <section className="ride-surface space-y-4 p-5"><div><p className="text-xs text-muted-foreground">Driver</p><p className="mt-1 font-medium">{driver.name ?? "Uaway driver"}{driver.verified ? " · ID verified" : ""}</p></div><div><p className="text-xs text-muted-foreground">Vehicle</p><p className="mt-1 font-medium">{car.name} · {car.plateNumber}</p></div><div><p className="text-xs text-muted-foreground">Trip status</p><p className="mt-1 font-medium capitalize">{journey.status.replaceAll("_", " ")}</p></div><p className="border-t pt-3 text-xs text-muted-foreground">This private link expires {share.expiresAt.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}. It shows the trip, driver and vehicle only.</p></section>
    {booking.status === "confirmed" && <TripLocationViewer token={token} initial={location ? { latitude: location.latitude, longitude: location.longitude, accuracyMeters: location.accuracyMeters, recordedAt: location.recordedAt.toISOString() } : null} />}
    <p className="text-xs leading-relaxed text-muted-foreground">If the traveler needs immediate help in Kenya, call 999 or 112.</p>
  </main>;
}
