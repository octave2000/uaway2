import { z } from "zod";

export const modeSchema = z.enum(["passenger", "driver"]);
export const bookingInput = z.object({
  journeyId: z.string().uuid(),
  seatsBooked: z.coerce.number().int().min(1).max(8),
  luggageSpace: z.coerce.number().int().min(0).max(200),
  paymentPhone: z
    .string()
    .transform((v) => v.replace(/\D/g, "").replace(/^0/, "254"))
    .pipe(
      z.string().regex(/^254[17]\d{8}$/, "Enter a valid Kenyan mobile number."),
    ),
  idempotencyKey: z.string().uuid(),
});
export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export const HOLD_MS = 10 * 60 * 1000;
export const PAYOUT_DELAY_MS = 6 * 60 * 60 * 1000;
export function canSettle(
  booking: {
    status: string;
    completedAt: Date | null;
    disputedAt: Date | null;
  },
  now = new Date(),
) {
  return (
    booking.status === "completed" &&
    !booking.disputedAt &&
    !!booking.completedAt &&
    now.getTime() >= booking.completedAt.getTime() + PAYOUT_DELAY_MS
  );
}
export function paymentOutcome(
  current: string,
  resultCode: number | undefined,
): "success" | "failed" | "pending" | "unchanged" {
  if (current === "success" || current === "refunded") return "unchanged";
  if (resultCode === 0) return "success";
  // Only documented final STK failures; unknown/provider transient results stay pending.
  if ([1, 1032, 1037, 2001].includes(resultCode ?? -1)) return "failed";
  return "pending";
}
export function parseNairobiDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new DomainError("date", "Enter a departure date and time.");
  const date = new Date(`${value}:00+03:00`);
  if (Number.isNaN(date.getTime()))
    throw new DomainError("date", "Invalid departure date.");
  return date;
}
export function nairobiDay(value: string): [Date, Date] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    throw new DomainError("date", "Invalid search date.");
  const start = new Date(`${value}T00:00:00+03:00`);
  if (
    Number.isNaN(start.getTime()) ||
    new Date(start.getTime() + 10800000).toISOString().slice(0, 10) !== value
  )
    throw new DomainError("date", "Invalid search date.");
  return [start, new Date(start.getTime() + 86400000)];
}
export function formatKES(minor: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(minor / 100);
}
export function formatDeparture(date: Date | string) {
  return new Intl.DateTimeFormat("en-KE", {
    timeZone: "Africa/Nairobi",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}
