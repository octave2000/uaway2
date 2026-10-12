import Link from "next/link";
import { and, eq, asc, gt, count, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  bookings,
  journeys,
  outbox,
  supportCases,
  refunds,
  payoutRequests,
} from "@/db/schema";
import { requireAuthenticatedUser, requireSuperAdmin } from "@/lib/auth/roles";
import { formatDeparture } from "@/lib/domain/policy";
import { OnboardingGate } from "@/components/dashboard/onboarding-gate";
export default async function Dashboard() {
  const { userId, role, name } = await requireAuthenticatedUser();
  if (!role) return <OnboardingGate />;
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (role === "super_admin") {
    await requireSuperAdmin();
    const [cases, refundCount, payoutCount] = await Promise.all([
      db
        .select({ n: count() })
        .from(supportCases)
        .where(eq(supportCases.status, "open")),
      db
        .select({ n: count() })
        .from(refunds)
        .where(eq(refunds.status, "pending")),
      db
        .select({ n: count() })
        .from(payoutRequests)
        .where(eq(payoutRequests.status, "pending")),
    ]);
    return (
      <div className="page-content">
        <h1 className="page-title">Operations</h1>
        <p className="page-description">
          Keep journeys moving and resolve what needs attention.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Open support cases", cases[0].n, "support"],
            ["Refunds to process", refundCount[0].n, "payments"],
            ["Payouts to process", payoutCount[0].n, "payments"],
          ].map(([label, n, path]) => (
            <Link
              className="panel"
              href={`/dashboard/admin/${path}`}
              key={label}
            >
              <p className="text-sm text-muted-foreground">{label}</p>
              <strong className="mt-3 block text-3xl">{n}</strong>
            </Link>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            "users",
            "vehicles",
            "journeys",
            "bookings",
            "payments",
            "support",
          ].map((section) => (
            <Link
              className="panel capitalize"
              key={section}
              href={`/dashboard/admin/${section}`}
            >
              {section} →
            </Link>
          ))}
        </div>
      </div>
    );
  }
  const [upcoming, notifications] = await Promise.all([
    db
      .select({ b: bookings, j: journeys })
      .from(bookings)
      .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
      .where(
        and(
          eq(bookings.clientId, userId),
          eq(bookings.status, "confirmed"),
          gt(journeys.departureTime, new Date()),
        ),
      )
      .orderBy(asc(journeys.departureTime))
      .limit(1),
    db
      .select({ n: count() })
      .from(outbox)
      .where(and(eq(outbox.userId, userId), isNull(outbox.readAt))),
  ]);
  return (
    <div className="page-content">
      <p className="text-xs font-medium tracking-widest text-primary">
        WELCOME BACK
      </p>
      <h1 className="page-title">
        Hello, {name?.split(" ")[0] || "traveller"}.
      </h1>
      <p className="page-description">
        {role === "driver"
          ? "Your next journey starts with an open seat."
          : "Where will your next journey take you?"}
      </p>
      {(!user.verified || !user.emailVerified) && (
        <Link href="/dashboard/profile" className="panel border-amber-300">
          <h2 className="font-semibold">Finish setting up your account</h2>
          <p className="mt-2 text-sm">
            Verify your email and identity to book or offer a ride. Continue →
          </p>
        </Link>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href={role === "driver" ? "/dashboard/journeys/new" : "/rides"}
          className="rounded-2xl bg-primary p-6 text-primary-foreground"
        >
          <h2 className="text-2xl font-semibold">
            {role === "driver" ? "Offer a ride" : "Find a ride"}
          </h2>
          <p className="mt-3 text-sm">
            {role === "driver"
              ? "Publish a journey and share the road."
              : "Explore upcoming rides across Kenya."}{" "}
            →
          </p>
        </Link>
        <Link
          href={
            role === "driver" ? "/dashboard/journeys" : "/dashboard/bookings"
          }
          className="panel"
        >
          <h2 className="text-2xl font-semibold">
            {role === "driver" ? "Manage journeys" : "My bookings"}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Your plans, payments, and next steps in one place. →
          </p>
        </Link>
      </div>
      {upcoming[0] && (
        <Link
          className="panel"
          href={`/dashboard/bookings/${upcoming[0].b.id}`}
        >
          <p className="text-sm text-muted-foreground">Your next ride</p>
          <h2 className="mt-2 text-xl font-semibold">
            {upcoming[0].j.origin} → {upcoming[0].j.destination}
          </h2>
          <p className="mt-2 text-sm">
            {formatDeparture(upcoming[0].j.departureTime)}
          </p>
        </Link>
      )}
      <Link href="/dashboard/notifications" className="text-sm text-primary">
        {notifications[0].n} unread updates →
      </Link>
    </div>
  );
}
