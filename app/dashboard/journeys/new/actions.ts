"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { journeys } from "@/db/schema";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function postJourneyAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const carId = formData.get("carId") as string;
  const origin = formData.get("origin") as string;
  const destination = formData.get("destination") as string;
  const departureTime = new Date(formData.get("departureTime") as string);
  const pricePerSeat = parseInt(formData.get("pricePerSeat") as string);
  const seatsAvailable = parseInt(formData.get("seatsAvailable") as string);
  const luggageCapacity = parseInt(formData.get("luggageCapacity") as string);

  await db.insert(journeys).values({
    driverId: session.user.id,
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
