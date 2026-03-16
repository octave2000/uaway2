"use server"

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { cars } from "@/db/schema";
import { requireRole } from "@/lib/auth/roles";

export async function updateCarAction(formData: FormData) {
  const { userId } = await requireRole("driver");

  const carId = formData.get("carId") as string;
  const name = formData.get("name") as string;
  const plateNumber = formData.get("plateNumber") as string;
  const seats = parseInt(formData.get("seats") as string, 10);
  const luggageCapacity = parseInt(formData.get("luggageCapacity") as string, 10);

  if (
    !carId ||
    !name ||
    !plateNumber ||
    Number.isNaN(seats) ||
    Number.isNaN(luggageCapacity) ||
    seats < 1 ||
    luggageCapacity < 0
  ) {
    redirect("/dashboard/cars");
  }

  await db
    .update(cars)
    .set({
      name,
      plateNumber: plateNumber.toUpperCase(),
      seats,
      luggageCapacity,
    })
    .where(and(eq(cars.id, carId), eq(cars.driverId, userId)));

  revalidatePath("/dashboard/cars");
  revalidatePath(`/dashboard/cars/${carId}`);
}

export async function submitCarVerificationAction(formData: FormData) {
  const { userId } = await requireRole("driver");
  const carId = formData.get("carId") as string;

  if (!carId) {
    redirect("/dashboard/cars");
  }

  await db
    .update(cars)
    .set({
      verified: true,
    })
    .where(and(eq(cars.id, carId), eq(cars.driverId, userId)));

  revalidatePath("/dashboard/cars");
  revalidatePath(`/dashboard/cars/${carId}`);
}
