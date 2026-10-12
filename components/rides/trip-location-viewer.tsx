"use client";

import { useEffect, useState } from "react";

type Point = { latitude: string; longitude: string; accuracyMeters: number | null; recordedAt: string } | null;
export function TripLocationViewer({ token, initial }: { token: string; initial: Point }) {
  const [point, setPoint] = useState(initial);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const response = await fetch(`/api/share/${encodeURIComponent(token)}/location`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json() as { location: Point };
      if (active) setPoint(data.location);
    };
    const timer = window.setInterval(() => void refresh(), 30000);
    void refresh();
    return () => { active = false; window.clearInterval(timer); };
  }, [token]);
  if (!point) return <p className="rounded-xl border p-4 text-sm text-muted-foreground">Live location has not been shared for this trip.</p>;
  const lat = Number(point.latitude);
  const lon = Number(point.longitude);
  const map = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(String(lat))}&mlon=${encodeURIComponent(String(lon))}#map=16/${encodeURIComponent(String(lat))}/${encodeURIComponent(String(lon))}`;
  return <div className="rounded-xl border p-4"><p className="text-sm font-medium">Latest shared location</p><p className="mt-1 text-xs text-muted-foreground">Updated {new Date(point.recordedAt).toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}{point.accuracyMeters ? ` · accuracy ±${point.accuracyMeters} m` : ""}</p><a className="mt-3 inline-flex min-h-10 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground" href={map} target="_blank" rel="noreferrer">Open location on map</a></div>;
}
