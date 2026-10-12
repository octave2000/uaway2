import { auth } from "@/auth";
import { getUserRole } from "@/lib/auth/roles";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PublicShell } from "./public-shell";

export async function RideShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const userId = session?.user?.id;
  const role = userId ? await getUserRole(userId) : null;
  if (!userId || !role) return <PublicShell>{children}</PublicShell>;
  return (
    <DashboardLayout role={role} userId={userId}>
      <div className="mx-auto max-w-6xl px-5 py-8">{children}</div>
    </DashboardLayout>
  );
}
