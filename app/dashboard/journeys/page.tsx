import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { journeys } from "@/db/schema";
import { requireAuthenticatedUser } from "@/lib/auth/roles";
import { formatDeparture } from "@/lib/domain/policy";
export default async function Journeys({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { userId, role } = await requireAuthenticatedUser();
  if (role !== "driver") redirect("/rides");
  const page = Math.max(
    1,
    Math.min(1000, Number((await searchParams).page) || 1),
  );
  const rows = await db
    .select()
    .from(journeys)
    .where(eq(journeys.driverId, userId))
    .orderBy(desc(journeys.departureTime))
    .limit(21)
    .offset((page - 1) * 20);
  return (
    <div className="page-content">
      <div className="flex items-center justify-between">
        <h1 className="page-title">My journeys</h1>
        <Link
          className="rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
          href="/dashboard/journeys/new"
        >
          Offer a ride
        </Link>
      </div>
      <p className="page-description">
        Manage upcoming journeys and see your history.
      </p>
      {rows.slice(0, 20).map((j) => (
        <Link
          className="panel hover:border-primary"
          key={j.id}
          href={`/dashboard/journeys/${j.id}/manage`}
        >
          <div className="flex justify-between">
            <h2 className="font-semibold">
              {j.origin} → {j.destination}
            </h2>
            <span className="text-sm capitalize">{j.status}</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {formatDeparture(j.departureTime)} · {j.seatsAvailable} seats
            available
          </p>
        </Link>
      ))}
      {!rows.length && (
        <p className="empty-state">
          Your first journey starts here. Offer a ride when you’re ready.
        </p>
      )}
      <nav className="flex justify-between">
        {page > 1 ? (
          <Link href={`?page=${page - 1}`}>← Previous</Link>
        ) : (
          <span />
        )}
        {rows.length > 20 && <Link href={`?page=${page + 1}`}>Next →</Link>}
      </nav>
    </div>
  );
}
