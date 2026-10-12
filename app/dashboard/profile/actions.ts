"use server";

import { runAction } from "@/lib/domain/action";
import { ownedFile } from "@/lib/domain/files";
import { z } from "zod";
import { modeSchema } from "@/lib/domain/policy";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { deleteTrustedContact, saveTrustedContact } from "@/lib/domain/trip-safety";

export async function updateProfileAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await runAction("/dashboard/profile", async () => {
    const name = z.string().trim().min(2).max(100).parse(formData.get("name"));
    const phone = z
      .string()
      .trim()
      .max(20)
      .parse(formData.get("phone") ?? "");
    const defaultRole = formData.get("defaultRole") as string;
    const profilePhotoUrl = z.string().max(2000).default("").parse(formData.get("profilePhotoUrl") ?? "");

    await db
      .update(users)
      .set({
        name,
        phone,
        ...(profilePhotoUrl
          ? { profilePhoto: await ownedFile(session.user.id, profilePhotoUrl, "profilePhoto") }
          : {}),
        ...(defaultRole && { defaultRole: modeSchema.parse(defaultRole) }),
      })
      .where(eq(users.id, session.user.id));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");
  });
}

export async function submitVerificationAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await runAction("/dashboard/profile", async () => {
    const idPhoto = (formData.get("idPhotoUrl") as string | null)?.trim() ?? "";
    const selfiePhoto =
      (formData.get("selfiePhotoUrl") as string | null)?.trim() ?? "";

    if (!idPhoto || !selfiePhoto) {
      throw new Error("Both the ID document and selfie are required.");
    }

    await db
      .update(users)
      .set({
        idPhoto: await ownedFile(session.user.id, idPhoto, "identityDocument"),
        selfiePhoto: await ownedFile(
          session.user.id,
          selfiePhoto,
          "selfiePhoto",
        ),
        verified: false,
      })
      .where(eq(users.id, session.user.id));

    revalidatePath("/dashboard/profile");
  });
}

export async function verifyEmailAction() {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Unauthorized");
  const { sendAccountLink } = await import("@/lib/auth/recovery");
  await sendAccountLink(session.user.email, "verify");
  const { redirect } = await import("next/navigation");
  redirect(
    "/dashboard/profile?notice=Check+your+inbox+for+the+verification+link.",
  );
}
export async function revokeSessionsAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const { sql } = await import("drizzle-orm");
  await db
    .update(users)
    .set({ sessionVersion: sql`${users.sessionVersion}+1` })
    .where(eq(users.id, session.user.id));
  const { signOut } = await import("@/auth");
  await signOut({ redirectTo: "/login" });
}
export async function saveTrustedContactAction(data: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await runAction("/dashboard/profile", () => saveTrustedContact(session.user.id, { name: data.get("name"), phone: data.get("phone") }));
  revalidatePath("/dashboard/profile");
}
export async function deleteTrustedContactAction(data: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await runAction("/dashboard/profile", () => deleteTrustedContact(session.user.id, String(data.get("contactId"))));
  revalidatePath("/dashboard/profile");
}
