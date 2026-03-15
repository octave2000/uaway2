"use server"

import { auth } from "@/auth";
import { db } from "@/db";
import { cars } from "@/db/schema";
import { redirect } from "next/navigation";

export async function addCarAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const plateNumber = formData.get("plateNumber") as string;
  const seats = parseInt(formData.get("seats") as string, 10);
  const luggageCapacity = parseInt(formData.get("luggageCapacity") as string, 10);
  
  // Note: Photo upload logic goes here. For now we leave it null.
  
  await db.insert(cars).values({
    driverId: session.user.id,
    name,
    plateNumber: plateNumber.toUpperCase(),
    seats,
    luggageCapacity,
  });

  redirect("/dashboard/cars");
}
