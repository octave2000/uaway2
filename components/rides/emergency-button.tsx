"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { raiseEmergencyAlertAction } from "@/app/dashboard/bookings/actions";

export function EmergencyButton({ bookingId }: { bookingId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  function alertSupport() {
    if (!window.confirm("Send an emergency alert to the Uaway support queue? This does not contact emergency services. You can call 999 directly below.")) return;
    startTransition(async () => {
      let location: { latitude: number; longitude: number } | undefined;
      if (navigator.geolocation) {
        location = await new Promise((resolve) => navigator.geolocation.getCurrentPosition(
          ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
          () => resolve(undefined),
          { enableHighAccuracy: true, timeout: 3500, maximumAge: 30000 },
        ));
      }
      try {
        await raiseEmergencyAlertAction(bookingId, location);
        setMessage("Alert saved to the support queue. Call emergency services if you need immediate help.");
      } catch {
        setMessage("Could not submit the in-app alert. Call emergency services directly if you need help.");
      }
    });
  }
  return (
    <div className="space-y-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
      <Button type="button" variant="destructive" className="w-full" onClick={alertSupport} disabled={isPending}>
        <AlertTriangle className="mr-2 size-4" />{isPending ? "Sending alert…" : "Emergency: alert Uaway support"}
      </Button>
      <a href="tel:999" className="flex min-h-10 items-center justify-center gap-2 rounded-lg border bg-background text-sm font-medium"><Phone size={15} />Call Kenya emergency services · 999</a>
      <a href="tel:112" className="block text-center text-xs text-muted-foreground">Or call 112 from your mobile</a>
      <p className="text-xs leading-relaxed text-muted-foreground">The in-app alert is recorded in the support queue; it is not monitored as a live emergency dispatch service.</p>
      {message && <p role="status" className="text-xs font-medium">{message}</p>}
    </div>
  );
}
