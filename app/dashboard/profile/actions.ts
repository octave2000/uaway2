"use server"

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateProfileAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const defaultRole = formData.get("defaultRole") as string;

  await db.update(users).set({
    name,
    phone,
    ...(defaultRole && { defaultRole: defaultRole as "passenger" | "driver" }),
  }).where(eq(users.id, session.user.id));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
}

export async function submitVerificationAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const idPhoto = (formData.get("idPhotoUrl") as string | null)?.trim() ?? "";
  const selfiePhoto = (formData.get("selfiePhotoUrl") as string | null)?.trim() ?? "";

  if (!idPhoto || !selfiePhoto) {
    throw new Error("Both the ID document and selfie are required.");
  }

  await db
    .update(users)
    .set({
      idPhoto,
      selfiePhoto,
      verified: false,
    })
    .where(eq(users.id, session.user.id));

  revalidatePath("/dashboard/profile");
}
