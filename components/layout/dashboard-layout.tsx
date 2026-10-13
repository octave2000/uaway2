import Link from "next/link";
import { Bell, CircleHelp } from "lucide-react";
import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { outbox } from "@/db/schema";
import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";
import { BrandLogo } from "@/components/shared/brand-logo";

export async function DashboardLayout({
  children,
  role,
  userId,
}: {
  children: React.ReactNode;
  role: "passenger" | "driver" | "super_admin";
  userId: string;
}) {
  const [unread] = await db
    .select({ n: count() })
    .from(outbox)
    .where(and(eq(outbox.userId, userId), isNull(outbox.readAt)));
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 z-40 hidden w-60 border-r bg-card md:block">
        <Sidebar role={role} />
      </aside>
      <div className="min-w-0 md:pl-60">
        <header className="flex h-16 items-center justify-between border-b bg-card px-5 md:px-8">
          <BrandLogo href="/dashboard" className="h-12 w-32 md:hidden" />
          <p className="hidden text-sm text-muted-foreground md:block">
            A little company. A better journey.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href={
                role === "super_admin"
                  ? "/dashboard/admin/support"
                  : "/dashboard/support"
              }
              aria-label="Help and support"
              className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <CircleHelp size={21} strokeWidth={1.6} />
            </Link>
            <Link
              href="/dashboard/notifications"
              aria-label={`Notifications${unread.n ? `, ${unread.n} unread` : ""}`}
              className="relative flex size-11 items-center justify-center rounded-full hover:bg-muted"
            >
              <Bell size={23} strokeWidth={1.6} />
              {unread.n > 0 && (
                <span className="absolute right-0 top-0 rounded-full border-2 border-card bg-destructive px-1.5 text-[10px] leading-4 text-white">
                  {unread.n > 9 ? "9+" : unread.n}
                </span>
              )}
            </Link>
          </div>
        </header>
        <main className="pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-6">
          {children}
        </main>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        <BottomNav role={role} />
      </div>
    </div>
  );
}
