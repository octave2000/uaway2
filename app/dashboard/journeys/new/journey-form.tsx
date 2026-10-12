"use client";
import { useRef, useState } from "react";
import { PlacePicker } from "@/components/rides/place-picker";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { postJourneyAction } from "./actions";
export function JourneyForm({
  cars,
}: {
  cars: Array<{
    id: string;
    name: string;
    seats: number;
    luggageCapacity: number;
  }>;
}) {
  const [step, setStep] = useState(0);
  const [summary, setSummary] = useState<Record<string, string>>({});
  const ref = useRef<HTMLFormElement>(null);
  function next() {
    const fields = ref.current!.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >(
      `[data-step="${step}"] input, [data-step="${step}"] select, [data-step="${step}"] textarea`,
    );
    for (const field of fields) if (!field.reportValidity()) return;
    setSummary(
      Object.fromEntries(
        Array.from(new FormData(ref.current!).entries()).map(([k, v]) => [
          k,
          String(v),
        ]),
      ),
    );
    setStep(step + 1);
  }
  return (
    <form ref={ref} action={postJourneyAction} className="panel space-y-6">
      <ol
        className="flex flex-wrap gap-4 text-sm"
        aria-label="Publishing steps"
      >
        {["Route", "Schedule", "Seats and price", "Review"].map((s, i) => (
          <li
            key={s}
            aria-current={i === step ? "step" : undefined}
            className={
              i === step
                ? "font-semibold text-primary"
                : "text-muted-foreground"
            }
          >
            {i + 1}. {s}
          </li>
        ))}
      </ol>
      <div data-step="0" hidden={step !== 0} className="space-y-4">
        <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">Short local trips are welcome. Enter the actual pickup and drop-off places passengers should use.</p>
        {[
          ["origin", "From"],
          ["destination", "To"],
        ].map(([name, label]) => (
          <label className="field" key={name}>
            {label}
            <PlacePicker
              name={name}
              label={label}
              required
              placeholder="Type a Kenyan town or place"
              className="control"
            />
          </label>
        ))}
        <p className="text-xs text-muted-foreground">
          Pick a town, neighbourhood, or place anywhere in Kenya. Add the exact
          meeting spot below.
        </p>
        <label className="field">
          Pickup instructions
          <input
            className="control"
            name="pickupInstructions"
            placeholder="For example, the main stage near the market"
            maxLength={300}
          />
        </label>
        <label className="field">
          Drop-off instructions
          <input
            className="control"
            name="dropoffInstructions"
            placeholder="For example, the bus station entrance"
            maxLength={300}
          />
        </label>
      </div>
      <div data-step="1" hidden={step !== 1} className="space-y-4">
        <label className="field">
          Departure (East Africa Time)
          <input
            className="control"
            type="datetime-local"
            name="departureTime"
            required
          />
        </label>
        <label className="field">
          Vehicle
          <select className="control" name="carId" required>
            {cars.map((c) => (
              <option value={c.id} key={c.id}>
                {c.name} · {c.seats} seats · {c.luggageCapacity} kg
              </option>
            ))}
          </select>
        </label>
      </div>
      <div data-step="2" hidden={step !== 2} className="space-y-4">
        {[
          ["seatsAvailable", "Seats offered", 1, 8],
          ["luggageCapacity", "Luggage allowance (kg)", 0, 200],
          ["pricePerSeat", "Price per seat (KES)", 50, 100000],
        ].map(([name, label, min, max]) => (
          <label className="field" key={name}>
            {label}
            <input
              className="control"
              type="number"
              name={String(name)}
              min={Number(min)}
              max={Number(max)}
              required
            />
          </label>
        ))}
        <label className="field">
          Notes for passengers
          <textarea className="control" name="note" maxLength={1000} />
        </label>
      </div>
      {step === 3 && (
        <div className="rounded-xl bg-muted p-5">
          <h2 className="text-xl font-semibold">
            {summary.origin} → {summary.destination}
          </h2>
          <p className="mt-3">{summary.departureTime.replace("T", " ")} EAT</p>
          <p className="mt-2">
            {summary.seatsAvailable} seats · {summary.luggageCapacity} kg · KES{" "}
            {summary.pricePerSeat} per seat
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            After passengers book, changing the route, time, fare, or vehicle
            requires cancellation and rebooking.
          </p>
        </div>
      )}
      <div className="flex justify-between">
        {step > 0 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(step - 1)}
          >
            Back
          </Button>
        ) : (
          <span />
        )}
        {step < 3 ? (
          <Button type="button" onClick={next}>
            Continue
          </Button>
        ) : (
          <SubmitButton>Publish journey</SubmitButton>
        )}
      </div>
    </form>
  );
}
