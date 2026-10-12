"use server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { cars } from "@/db/schema";
import { requireRole } from "@/lib/auth/roles";
import { runAction } from "@/lib/domain/action";
import { saveVehicle } from "@/lib/domain/vehicles";
import { ownedFile } from "@/lib/domain/files";
export async function updateCarAction(data: FormData) {
  const { userId } = await requireRole("driver");
  const id = String(data.get("carId"));
  await runAction(`/dashboard/cars/${id}`, () =>
    saveVehicle(userId, Object.fromEntries(data), id),
  );
}
export async function submitCarVerificationAction(data: FormData) {
  const { userId } = await requireRole("driver");
  const id = String(data.get("carId"));
  await runAction(`/dashboard/cars/${id}`, async () => {
    const documentPhoto = await ownedFile(
      userId,
      String(data.get("documentPhotoUrl")),
      "carDocument",
    );
    await db
      .update(cars)
      .set({ documentPhoto, verified: false, verificationNote: null })
      .where(and(eq(cars.id, id), eq(cars.driverId, userId)));
  });
}
