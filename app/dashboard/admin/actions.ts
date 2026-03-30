"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { cars, payoutRequests, users } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/auth/roles";

function asBoolean(value: FormDataEntryValue | null) {
  return value === "true";
}

export async function setUserVerificationAction(formData: FormData) {
  await requireSuperAdmin();

  const userId = formData.get("userId") as string | null;
  const nextState = asBoolean(formData.get("nextState"));

  if (!userId) {
    throw new Error("User is required.");
  }

  await db
    .update(users)
    .set({ verified: nextState })
    .where(eq(users.id, userId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/admin/users");
}

export async function setCarVerificationAction(formData: FormData) {
  await requireSuperAdmin();

  const carId = formData.get("carId") as string | null;
  const nextState = asBoolean(formData.get("nextState"));

  if (!carId) {
    throw new Error("Vehicle is required.");
  }

  await db
    .update(cars)
    .set({ verified: nextState })
    .where(eq(cars.id, carId));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/admin/vehicles");
  revalidatePath(`/dashboard/cars/${carId}`);
}

export async function updatePayoutRequestStatusAction(formData: FormData) {
  await requireSuperAdmin();

  const requestId = formData.get("requestId") as string | null;
  const status = formData.get("status") as "approved" | "rejected" | "paid" | null;

  if (!requestId || !status || !["approved", "rejected", "paid"].includes(status)) {
    throw new Error("Invalid payout status update.");
  }

  await db
    .update(payoutRequests)
    .set({
      status,
      respondedAt: new Date(),
    })
    .where(and(eq(payoutRequests.id, requestId)));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/admin/payments");
  revalidatePath("/dashboard/payments");
  revalidatePath("/dashboard/bookings");
}
