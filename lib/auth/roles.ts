import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
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
    .select({ defaultRole: users.defaultRole, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return null;
  }

  if (isConfiguredSuperAdminEmail(user.email)) {
    return "super_admin";
  }

  return user.defaultRole ?? null;
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

export async function requireRole(role: AppRole): Promise<AuthenticatedUserContext> {
  const user = await requireAuthenticatedUser();

  if (user.role !== role) {
    redirect("/dashboard");
  }

  return user;
}

export async function requireSuperAdmin(): Promise<AuthenticatedUserContext> {
  return requireRole("super_admin");
}
