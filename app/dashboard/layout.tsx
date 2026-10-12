import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { requireAuthenticatedUser } from "@/lib/auth/roles";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, userId } = await requireAuthenticatedUser();

  // If no role, bypass the layout shell to hide navbar/sidebar
  if (!role) {
    return <>{children}</>;
  }

  return (
    <DashboardLayout role={role} userId={userId}>
      {children}
    </DashboardLayout>
  );
}
