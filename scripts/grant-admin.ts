import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, sql } from "@/db";
import { adminGrants, users } from "@/db/schema";
const email = process.argv[2]?.trim().toLowerCase();
if (!email)
  throw new Error(
    "Usage: npm run db:grant-admin -- verified-admin@example.com",
  );
const [user] = await db.select().from(users).where(eq(users.email, email));
if (!user?.emailVerified)
  throw new Error(
    "Administrator must have a verified email before provisioning",
  );
await db.insert(adminGrants).values({ userId: user.id }).onConflictDoNothing();
console.log(
  "Administrator provisioned. Authenticator enrollment is required on next access.",
);
await sql.end();
