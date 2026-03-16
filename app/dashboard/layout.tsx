import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch the user's default role
  const [userRecord] = await db
    .select({ defaultRole: users.defaultRole })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const defaultRole = userRecord?.defaultRole;

  // If no role, bypass the layout shell to hide navbar/sidebar
  if (!defaultRole) {
    return <>{children}</>;
  }

  return <DashboardLayout>{children}</DashboardLayout>
}
