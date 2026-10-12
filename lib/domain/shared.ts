import { db } from "@/db";
import { auditEvents, outbox, users, rateLimits } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { DomainError } from "./policy";
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export async function eligible(tx: Tx, userId: string) {
  const [user] = await tx
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .for("update");
  if (!user || user.suspended)
    throw new DomainError(
      "account",
      "Your account is unavailable. Contact support.",
    );
  if (!user.emailVerified || !user.verified)
    throw new DomainError(
      "verification",
      "Verify your email and identity from your profile before continuing.",
    );
  return user;
}
export async function audit(
  tx: Tx,
  actorId: string | null,
  action: string,
  subjectId: string,
  details: Record<string, unknown> = {},
) {
  await tx.insert(auditEvents).values({ actorId, action, subjectId, details });
}
export async function notify(
  tx: Tx,
  key: string,
  userId: string,
  title: string,
  body: string,
  href: string,
) {
  await tx
    .insert(outbox)
    .values({ key, userId, title, body, href })
    .onConflictDoNothing();
}
export async function limit(key: string, max = 10, windowMs = 60000) {
  const now = new Date();
  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1, resetAt: new Date(now.getTime() + windowMs) })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${rateLimits.resetAt} <= ${now.toISOString()} THEN 1 ELSE ${rateLimits.count} + 1 END`,
        resetAt: sql`CASE WHEN ${rateLimits.resetAt} <= ${now.toISOString()} THEN ${new Date(now.getTime() + windowMs).toISOString()} ELSE ${rateLimits.resetAt} END`,
      },
    })
    .returning();
  if (row.count > max)
    throw new DomainError(
      "rate_limit",
      "Too many attempts. Please try again shortly.",
    );
}
