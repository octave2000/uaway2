"use client";
import { useState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { bookJourneyAction } from "@/app/dashboard/journeys/[id]/actions";
import { formatKES } from "@/lib/domain/policy";
export function Checkout({
  journeyId,
  seatsAvailable,
  luggageCapacity,
  priceMinor,
  feeMinor,
  idempotencyKey,
}: {
  journeyId: string;
  seatsAvailable: number;
  luggageCapacity: number;
  priceMinor: number;
  feeMinor: number;
  idempotencyKey: string;
}) {
  const [seats, setSeats] = useState(1);
  return (
    <form action={bookJourneyAction} className="space-y-4">
      <input type="hidden" name="journeyId" value={journeyId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <label className="field">
        Seats
        <input
          className="control"
          name="seatsBooked"
          type="number"
          min="1"
          max={Math.min(8, seatsAvailable)}
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          required
        />
      </label>
      <label className="field">
        Luggage (kg)
        <input
          className="control"
          name="luggageSpace"
          type="number"
          min="0"
          max={luggageCapacity}
          defaultValue="0"
          required
        />
      </label>
      <label className="field">
        M-Pesa phone number
        <input
          className="control"
          name="paymentPhone"
          type="tel"
          autoComplete="tel"
          placeholder="0712 345 678"
          required
        />
      </label>
      <div className="space-y-2 border-y py-4 text-sm" aria-live="polite">
        <div className="flex justify-between">
          <span>Fare ({seats || 0} seats)</span>
          <span>{formatKES(priceMinor * (seats || 0))}</span>
        </div>
        <div className="flex justify-between">
          <span>Booking fee</span>
          <span>{formatKES(feeMinor)}</span>
        </div>
        <div className="flex justify-between pt-2 text-base font-semibold">
          <span>Total</span>
          <span>{formatKES(priceMinor * (seats || 0) + feeMinor)}</span>
        </div>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        Identity and email verification are required. Seats are held for ten
        minutes while you approve payment.
      </p>
      <SubmitButton className="w-full" pendingText="Reserving…">
        Reserve and pay
      </SubmitButton>
    </form>
  );
}
