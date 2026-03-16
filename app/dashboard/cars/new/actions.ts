"use server"

import { db } from "@/db";
import { cars } from "@/db/schema";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roles";

export async function addCarAction(formData: FormData) {
  const { userId } = await requireRole("driver");

  const name = formData.get("name") as string;
  const plateNumber = formData.get("plateNumber") as string;
  const seats = parseInt(formData.get("seats") as string, 10);
  const luggageCapacity = parseInt(formData.get("luggageCapacity") as string, 10);

  if (!name || !plateNumber || Number.isNaN(seats) || Number.isNaN(luggageCapacity) || seats < 1 || luggageCapacity < 0) {
    redirect("/dashboard/cars/new");
  }
  
  // Note: Photo upload logic goes here. For now we leave it null.
  
  await db.insert(cars).values({
    driverId: userId,
    name,
    plateNumber: plateNumber.toUpperCase(),
    seats,
    luggageCapacity,
  });

  redirect("/dashboard/cars");
}
