import { createHash, randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, recoveryTokens } from "@/db/schema";
import { limit } from "@/lib/domain/shared";
import { DomainError } from "@/lib/domain/policy";
import { sendEmail } from "@/lib/email/mailer";
import { accountLinkEmail } from "@/lib/email/templates";
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function sendAccountLink(
  email: string,
  purpose: "verify" | "reset",
) {
  await limit(`account-link:${email}`, 3, 15 * 60000);
  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user || user.suspended) return;
  if (purpose === "verify" && user.emailVerified) return;
  const token = randomBytes(32).toString("hex");
  await db
    .insert(recoveryTokens)
    .values({
      tokenHash: digest(`${purpose}:${token}`),
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 60000),
    });
  const url = new URL(`/account/${purpose}`, process.env.APP_URL);
  url.searchParams.set("token", token);
  try {
    await sendEmail(email, accountLinkEmail(purpose, url.toString(), user.name));
  } catch (error) {
    console.error("Account link delivery failed", error);
    throw new DomainError(
      "email",
      "We couldn't send the email right now. Please try again shortly.",
    );
  }
}
export async function consumeAccountLink(
  token: string,
  purpose: "verify" | "reset",
  password?: string,
) {
  const passwordHash = password ? await hash(password, 12) : undefined;
  await db.transaction(async (tx) => {
    const [entry] = await tx
      .delete(recoveryTokens)
      .where(
        and(
          eq(recoveryTokens.tokenHash, digest(`${purpose}:${token}`)),
          gt(recoveryTokens.expiresAt, new Date()),
        ),
      )
      .returning();
    if (!entry)
      throw new DomainError(
        "token",
        "This link has expired or was already used. Request a new one.",
      );
    await tx
      .update(users)
      .set(
        purpose === "verify"
          ? { emailVerified: new Date() }
          : {
              passwordHash,
              sessionVersion: sql`${users.sessionVersion}+1`,
              // Opening the reset link proves the user controls the inbox.
              emailVerified: sql`coalesce(${users.emailVerified}, now())`,
            },
      )
      .where(eq(users.id, entry.userId));
  });
}
