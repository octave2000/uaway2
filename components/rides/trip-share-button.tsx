"use client";

import { useState, useTransition } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createTripShareAction, revokeTripSharesAction } from "@/app/dashboard/bookings/actions";

export function TripShareButton({ bookingId, contacts = [] }: { bookingId: string; contacts?: Array<{ id: string; name: string; phone: string }> }) {
  const [isPending, startTransition] = useTransition();
  const [link, setLink] = useState("");
  const [message, setMessage] = useState("");
  function createShare() {
    startTransition(async () => {
      let result: Awaited<ReturnType<typeof createTripShareAction>>;
      try {
        result = await createTripShareAction(bookingId);
      } catch {
        setMessage("Could not create a trip link. Please try again.");
        return;
      }
      const url = `${window.location.origin}${result.path}`;
      setLink(url);
      setMessage("Trip link ready. Send it only to someone you trust.");
      if (navigator.share) {
        try { await navigator.share({ title: "My Uaway trip", text: "Follow my trip status", url }); } catch { /* The user may close the share sheet; the link remains available below. */ }
      } else {
        try { await navigator.clipboard.writeText(url); setMessage("Trip link copied. Send it only to someone you trust."); } catch { /* Link remains visible for manual copy. */ }
      }
    });
  }
  function revokeShare() {
    if (!window.confirm("Revoke all active trip links for this booking?")) return;
    startTransition(async () => {
      await revokeTripSharesAction(bookingId);
      setLink("");
      setMessage("Trip link revoked.");
    });
  }
  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="w-full" onClick={createShare} disabled={isPending}>
        <Share2 className="mr-2 size-4" />{isPending ? "Creating link…" : "Share trip with someone"}
      </Button>
      {link && <label className="field">Private trip link<input className="control" readOnly value={link} onFocus={(event) => event.currentTarget.select()} /></label>}
      <Button type="button" variant="outline" className="w-full" onClick={revokeShare} disabled={isPending}>Revoke active trip links</Button>
      {link && contacts.length > 0 && <div className="flex flex-wrap gap-2">{contacts.map((contact) => <a key={contact.id} className="inline-flex min-h-10 items-center rounded-full border px-3 text-xs font-medium" href={`sms:${encodeURIComponent(contact.phone)}?body=${encodeURIComponent(`Follow my Uaway trip: ${link}`)}`}>Text {contact.name}</a>)}</div>}
      {message && <p role="status" className="text-xs text-muted-foreground">{message}</p>}
      <p className="text-xs text-muted-foreground">Link expires automatically after the trip window. Anyone with the link can view trip details.</p>
    </div>
  );
}
