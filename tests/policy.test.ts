import { describe, it, expect } from "vitest";
import {
  bookingInput,
  modeSchema,
  paymentOutcome,
  canSettle,
  nairobiDay,
  parseNairobiDate,
} from "@/lib/domain/policy";
describe("security and lifecycle policy", () => {
  it("rejects administrative role injection", () => {
    expect(modeSchema.safeParse("super_admin").success).toBe(false);
    expect(modeSchema.safeParse("driver").success).toBe(true);
  });
  it("validates integer capacity and Kenyan phone numbers", () => {
    const input = {
      journeyId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      seatsBooked: "1",
      luggageSpace: "0",
      paymentPhone: "0712345678",
    };
    expect(bookingInput.parse(input).paymentPhone).toBe("254712345678");
    for (const bad of ["-1", "1.5", "1x", "999999999"])
      expect(
        bookingInput.safeParse({ ...input, seatsBooked: bad }).success,
      ).toBe(false);
    expect(
      bookingInput.safeParse({ ...input, paymentPhone: "25412" }).success,
    ).toBe(false);
  });
  it("does not regress success or treat an unknown response as failure", () => {
    expect(paymentOutcome("success", 1032)).toBe("unchanged");
    expect(paymentOutcome("refunded", 0)).toBe("unchanged");
    expect(paymentOutcome("pending", undefined)).toBe("pending");
    expect(paymentOutcome("pending", 500)).toBe("pending");
    expect(paymentOutcome("pending", 1032)).toBe("failed");
  });
  it("uses the passenger completion window and blocks disputed funds", () => {
    const now = new Date("2026-10-09T12:00:00Z");
    const booking = {
      status: "completed",
      completedAt: new Date("2026-10-09T06:00:00Z"),
      disputedAt: null,
    };
    expect(canSettle(booking, now)).toBe(true);
    expect(
      canSettle(
        { ...booking, completedAt: new Date("2026-10-09T06:00:01Z") },
        now,
      ),
    ).toBe(false);
    expect(canSettle({ ...booking, disputedAt: now }, now)).toBe(false);
  });
  it("uses Nairobi boundaries independently of the host timezone", () => {
    expect(nairobiDay("2026-10-09").map((d) => d.toISOString())).toEqual([
      "2026-10-08T21:00:00.000Z",
      "2026-10-09T21:00:00.000Z",
    ]);
    expect(parseNairobiDate("2026-10-09T09:30").toISOString()).toBe(
      "2026-10-09T06:30:00.000Z",
    );
    expect(() => nairobiDay("2026-02-30")).toThrow();
  });
});
