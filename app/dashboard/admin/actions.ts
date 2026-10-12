"use server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  cars,
  users,
  supportCases,
  bookings,
  payments,
  payoutRequests,
  emergencyAlerts,
} from "@/db/schema";
import { requireSuperAdmin } from "@/lib/auth/roles";
import { audit, notify } from "@/lib/domain/shared";
import { runAction } from "@/lib/domain/action";
import { DomainError } from "@/lib/domain/policy";
import {
  recordSettlement,
  reconcileSettlement,
} from "@/lib/domain/settlements";
import { lockBooking, queueRefund } from "@/lib/domain/reservations";
export async function setUserVerificationAction(data: FormData) {
  const { userId: actor } = await requireSuperAdmin();
  await runAction("/dashboard/admin/users", async () => {
    const id = z.string().uuid().parse(data.get("userId"));
    const verified = data.get("nextState") === "true";
    const note = String(data.get("note") || "").slice(0, 1000);
    await db.transaction(async (tx) => {
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, id))
        .for("update");
      if (
        !user ||
        (verified &&
          (!user.idPhoto?.startsWith("/api/files/") ||
            !user.selfiePhoto?.startsWith("/api/files/")))
      )
        throw new DomainError(
          "documents",
          "Private identity documents and a selfie are required before approval.",
        );
      await tx
        .update(users)
        .set({ verified, verificationNote: note || null })
        .where(eq(users.id, id));
      await audit(tx, actor, "verification.user", id, {
        before: user.verified,
        verified,
        note,
      });
      await notify(
        tx,
        `verification:${id}:${crypto.randomUUID()}`,
        id,
        verified ? "Identity approved" : "Identity needs attention",
        note ||
          (verified
            ? "You can now book rides and complete driver onboarding."
            : "Open your profile to check your documents."),
        "/dashboard/profile",
      );
    });
  });
}
export async function setCarVerificationAction(data: FormData) {
  const { userId: actor } = await requireSuperAdmin();
  await runAction("/dashboard/admin/vehicles", async () => {
    const id = z.string().uuid().parse(data.get("carId"));
    const verified = data.get("nextState") === "true";
    const note = String(data.get("note") || "").slice(0, 1000);
    const bypassDocuments = data.get("bypassDocuments") === "yes";
    await db.transaction(async (tx) => {
      const [car] = await tx
        .select()
        .from(cars)
        .where(eq(cars.id, id))
        .for("update");
      if (!car) throw new DomainError("missing", "Vehicle not found.");
      const hasPrivateDocument = car.documentPhoto?.startsWith("/api/files/");
      if (verified && !hasPrivateDocument && !bypassDocuments)
        throw new DomainError(
          "documents",
          "Upload private vehicle documents before approval.",
        );
      if (
        verified &&
        !hasPrivateDocument &&
        bypassDocuments &&
        note.trim().length < 10
      )
        throw new DomainError(
          "review_note",
          "Add at least 10 characters explaining why you are approving without documents.",
        );
      await tx
        .update(cars)
        .set({ verified, verificationNote: note || null })
        .where(eq(cars.id, id));
      await audit(tx, actor, "verification.vehicle", id, {
        before: car.verified,
        verified,
        documentBypass: verified && !hasPrivateDocument && bypassDocuments,
        note,
      });
      await notify(
        tx,
        `car-review:${id}:${crypto.randomUUID()}`,
        car.driverId,
        verified ? "Vehicle approved" : "Vehicle needs attention",
        note || "Open your vehicle to see its status.",
        `/dashboard/cars/${id}`,
      );
    });
  });
}
export async function setCarInsuranceAction(data: FormData) {
  const { userId: actor } = await requireSuperAdmin();
  await runAction("/dashboard/admin/vehicles", async () => {
    const id = z.string().uuid().parse(data.get("carId"));
    const verified = data.get("nextState") === "true";
    const note = String(data.get("note") || "").trim().slice(0, 1000);
    await db.transaction(async (tx) => {
      const [car] = await tx.select().from(cars).where(eq(cars.id, id)).for("update");
      if (!car) throw new DomainError("missing", "Vehicle not found.");
      if (verified && (!car.insuranceDocument?.startsWith("/api/files/") || !car.insuranceExpiry || car.insuranceExpiry <= new Date()))
        throw new DomainError("insurance", "A private certificate with a future expiry date is required.");
      await tx.update(cars).set({ insuranceVerifiedAt: verified ? new Date() : null, insuranceVerificationNote: note || null }).where(eq(cars.id, id));
      await audit(tx, actor, "verification.insurance", id, { verified, note, expiry: car.insuranceExpiry });
      await notify(tx, `insurance-review:${id}:${crypto.randomUUID()}`, car.driverId, verified ? "Insurance verified" : "Insurance needs attention", note || "Open your vehicle to review your insurance status.", `/dashboard/cars/${id}`);
    });
  });
}
export async function suspendUserAction(data: FormData) {
  const { userId: actor } = await requireSuperAdmin();
  const id = z.string().uuid().parse(data.get("userId"));
  await runAction("/dashboard/admin/users", async () => {
    if (id === actor)
      throw new DomainError("self", "You cannot suspend yourself.");
    await db.transaction(async (tx) => {
      const [user] = await tx
        .select()
        .from(users)
        .where(eq(users.id, id))
        .for("update");
      if (!user) throw new DomainError("missing", "User not found.");
      const suspended = !user.suspended;
      await tx
        .update(users)
        .set({ suspended, sessionVersion: user.sessionVersion + 1 })
        .where(eq(users.id, id));
      await audit(tx, actor, "user.suspension", id, { suspended });
    });
  });
}
export async function settlementAction(data: FormData) {
  const { userId } = await requireSuperAdmin();
  const kind = z.enum(["refund", "payout"]).parse(data.get("kind"));
  const id = z.string().uuid().parse(data.get("id"));
  await runAction("/dashboard/admin/payments", () =>
    data.get("command") === "record"
      ? recordSettlement(userId, kind, id, String(data.get("reference")))
      : reconcileSettlement(userId, kind, id),
  );
}
export async function resolveCaseAction(data: FormData) {
  const { userId: actor } = await requireSuperAdmin();
  const id = z.string().uuid().parse(data.get("id"));
  const resolution = z
    .string()
    .trim()
    .min(10)
    .max(4000)
    .parse(data.get("resolution"));
  await runAction("/dashboard/admin/support", () =>
    db.transaction(async (tx) => {
      const [ref] = await tx
        .select()
        .from(supportCases)
        .where(eq(supportCases.id, id));
      if (!ref) throw new DomainError("missing", "Case not found.");
      if (ref.bookingId) {
        const { booking } = await lockBooking(tx, ref.bookingId);
        if (data.get("refund") === "yes") {
          const [payment] = await tx
            .select()
            .from(payments)
            .where(
              and(
                eq(payments.bookingId, booking.id),
                eq(payments.status, "success"),
              ),
            )
            .for("update");
          if (!payment)
            throw new DomainError(
              "payment",
              "No successful payment to refund.",
            );
          const [paid] = await tx
            .select()
            .from(payoutRequests)
            .where(
              and(
                eq(payoutRequests.paymentId, payment.id),
                eq(payoutRequests.status, "paid"),
              ),
            );
          if (paid)
            throw new DomainError(
              "paid",
              "This payment is already paid out. Escalate the case before any refund.",
            );
          await queueRefund(tx, payment, resolution);
        }
        const open = await tx
          .select()
          .from(supportCases)
          .where(
            and(
              eq(supportCases.bookingId, booking.id),
              eq(supportCases.status, "open"),
            ),
          );
        if (open.every((c) => c.id === id))
          await tx
            .update(bookings)
            .set({ disputedAt: null })
            .where(eq(bookings.id, booking.id));
      }
      await tx
        .update(supportCases)
        .set({ status: "resolved", resolution })
        .where(eq(supportCases.id, id));
      if (ref.emergencyAlertId)
        await tx.update(emergencyAlerts).set({ status: "resolved" }).where(eq(emergencyAlerts.id, ref.emergencyAlertId));
      await audit(tx, actor, "support.resolved", id, { resolution });
      await notify(
        tx,
        `resolved:${id}`,
        ref.userId,
        "Support update",
        resolution,
        "/dashboard/support",
      );
    }),
  );
}
