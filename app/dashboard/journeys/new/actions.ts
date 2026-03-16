"use server";

import { db } from "@/db";
import { cars, journeys } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/roles";

export async function postJourneyAction(formData: FormData) {
  const { userId } = await requireRole("driver");

  const carId = formData.get("carId") as string;
  const origin = formData.get("origin") as string;
  const destination = formData.get("destination") as string;
  const departureTime = new Date(formData.get("departureTime") as string);
  const pricePerSeat = parseInt(formData.get("pricePerSeat") as string, 10);
  const seatsAvailable = parseInt(formData.get("seatsAvailable") as string, 10);
  const luggageCapacity = parseInt(formData.get("luggageCapacity") as string, 10);

  if (
    !carId ||
    !origin ||
    !destination ||
    Number.isNaN(departureTime.getTime()) ||
    Number.isNaN(pricePerSeat) ||
    Number.isNaN(seatsAvailable) ||
    Number.isNaN(luggageCapacity) ||
    departureTime <= new Date() ||
    pricePerSeat < 50 ||
    seatsAvailable < 1 ||
    luggageCapacity < 0
  ) {
    redirect("/dashboard/journeys/new");
  }

  const [car] = await db
    .select({
      id: cars.id,
      seats: cars.seats,
      luggageCapacity: cars.luggageCapacity,
    })
    .from(cars)
    .where(and(eq(cars.id, carId), eq(cars.driverId, userId)))
    .limit(1);

  if (
    !car ||
    seatsAvailable > car.seats ||
    luggageCapacity > car.luggageCapacity
  ) {
    redirect("/dashboard/journeys/new");
  }

  await db.insert(journeys).values({
    driverId: userId,
    carId,
    origin,
    destination,
    departureTime,
    pricePerSeat,
    seatsAvailable,
    luggageCapacity,
    status: "active",
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/journeys");
  redirect("/dashboard/journeys");
}
