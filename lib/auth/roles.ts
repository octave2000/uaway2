import { hasMfa, isAdminMfaRequired } from "./mfa";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, adminGrants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export type AppRole = "passenger" | "driver" | "super_admin";

export interface AuthenticatedUserContext {
  userId: string;
  role: AppRole | null;
  name: string | null | undefined;
  email: string | null | undefined;
}

function getConfiguredSuperAdminEmails() {
  return (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isConfiguredSuperAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return getConfiguredSuperAdminEmails().includes(email.trim().toLowerCase());
}

export async function getUserRole(userId: string): Promise<AppRole | null> {
  const [user] = await db
    .select({
      defaultRole: users.defaultRole,
      email: users.email,
      emailVerified: users.emailVerified,
      suspended: users.suspended,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user || user.suspended) {
    return null;
  }

  const [grant] = await db
    .select()
    .from(adminGrants)
    .where(eq(adminGrants.userId, userId));
  if (
    user.emailVerified &&
    (grant || isConfiguredSuperAdminEmail(user.email))
  ) {
    return "super_admin";
  }

  return user.defaultRole === "driver"
    ? "driver"
    : user.defaultRole === "passenger"
      ? "passenger"
      : null;
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUserContext> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return {
    userId: session.user.id,
    role: await getUserRole(session.user.id),
    name: session.user.name,
    email: session.user.email,
  };
}

export async function requireRole(
  role: AppRole,
): Promise<AuthenticatedUserContext> {
  const user = await requireAuthenticatedUser();

  if (user.role !== role) {
    redirect("/dashboard");
  }

  return user;
}

export async function requireSuperAdmin(): Promise<AuthenticatedUserContext> {
  const user = await requireRole("super_admin");
  if (isAdminMfaRequired() && !(await hasMfa(user.userId)))
    redirect("/dashboard/security");
  return user;
}
