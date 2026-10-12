"use server";
import { requireRole } from "@/lib/auth/roles";
import { runAction } from "@/lib/domain/action";
import { saveVehicle } from "@/lib/domain/vehicles";
export async function addCarAction(data: FormData) {
  const { userId } = await requireRole("driver");
  await runAction("/dashboard/cars", () =>
    saveVehicle(userId, Object.fromEntries(data)),
  );
}
