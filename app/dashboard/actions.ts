"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function setUserRoleAction(role: "passenger" | "driver") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db.update(users)
    .set({ defaultRole: role })
    .where(eq(users.id, session.user.id));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
  return { success: true };
}
