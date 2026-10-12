"use client";

import { useEffect, useState } from "react";
import { MapPin, Radio } from "lucide-react";

export function TripLocationPublisher({ bookingIds }: { bookingIds: string[] }) {
  const [sharing, setSharing] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => {
    if (!sharing || !bookingIds.length || !navigator.geolocation) return;
    let lastSent = 0;
    const watchId = navigator.geolocation.watchPosition(async ({ coords }) => {
      if (Date.now() - lastSent < 20000) return;
      lastSent = Date.now();
      try {
        const responses = await Promise.all(bookingIds.map((bookingId) => fetch(`/api/bookings/${bookingId}/location`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }),
        })));
        if (responses.some((response) => !response.ok)) throw new Error("Location update rejected");
        setStatus("Your live location is shared with people holding each trip link.");
      } catch { setStatus("Could not update location. Check your connection."); }
    }, () => setStatus("Location permission was denied. Sharing is off."), { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 });
    return () => navigator.geolocation.clearWatch(watchId);
  }, [sharing, bookingIds]);
  async function toggleSharing() {
    if (sharing) {
      await Promise.all(bookingIds.map((bookingId) => fetch(`/api/bookings/${bookingId}/location`, { method: "DELETE" })));
      setStatus("Location sharing stopped and the last shared location was cleared.");
    }
    setSharing((value) => !value);
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
      <div className="flex items-start gap-3">
        {sharing ? <Radio className="mt-0.5 size-4 animate-pulse text-emerald-600" /> : <MapPin className="mt-0.5 size-4 text-muted-foreground" />}
        <div><p className="text-sm font-medium">Trip location sharing</p><p className="mt-1 text-xs text-muted-foreground">Off by default. Your location is sent only while this page is open and you turn sharing on.</p>{status && <p role="status" className="mt-1 text-xs">{status}</p>}</div>
      </div>
      <button type="button" disabled={!bookingIds.length} onClick={toggleSharing} className="min-h-10 rounded-full border px-4 text-sm font-medium disabled:opacity-50">{sharing ? "Stop sharing" : "Share my location"}</button>
    </div>
  );
}
