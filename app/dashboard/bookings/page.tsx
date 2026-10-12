import Link from "next/link";
import { and, eq, desc, asc, inArray, not } from "drizzle-orm";
import { ArrowUpRight, Ticket } from "lucide-react";
import { db } from "@/db";
import { bookings, journeys } from "@/db/schema";
import { requireAuthenticatedUser } from "@/lib/auth/roles";
import { formatDeparture, formatKES } from "@/lib/domain/policy";
import { RouteTimeline } from "@/components/rides/route-timeline";

type BookingRow = {
  booking: typeof bookings.$inferSelect;
  journey: typeof journeys.$inferSelect;
};
function BookingCard({ booking: b, journey: j }: BookingRow) {
  return (
    <Link
      href={`/dashboard/bookings/${b.id}`}
      className="ride-surface group block p-4 transition hover:border-primary/40 sm:p-5"
    >
      <div className="mb-5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>{formatDeparture(j.departureTime)} · EAT</span>
        <span className="shrink-0 capitalize">
          {b.status.replaceAll("_", " ")}
        </span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
        <RouteTimeline
          origin={j.origin}
          destination={j.destination}
          pickup={j.pickupInstructions}
          dropoff={j.dropoffInstructions}
        />
        <div className="flex flex-col justify-between text-right">
          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">Total fare</p>
            <span className="fare-chip">
              {formatKES(b.fareMinor + b.feeMinor)}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Seats</p>
            <p className="mt-1 text-sm">{b.seatsBooked}</p>
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
        <span>{b.luggageSpace} kg luggage</span>
        <span className="flex items-center gap-1 font-medium text-primary">
          Ride details <ArrowUpRight size={14} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
export default async function Bookings({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { userId } = await requireAuthenticatedUser();
  const page = Math.max(
    1,
    Math.min(1000, Math.floor(Number((await searchParams).page) || 1)),
  );
  const activeFilter = and(
    inArray(bookings.status, ["payment_pending", "confirmed"]),
    inArray(journeys.status, ["active", "ongoing"]),
  )!;
  const [active, past] = await Promise.all([
    db
      .select({ booking: bookings, journey: journeys })
      .from(bookings)
      .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
      .where(and(eq(bookings.clientId, userId), activeFilter))
      .orderBy(asc(journeys.departureTime)),
    db
      .select({ booking: bookings, journey: journeys })
      .from(bookings)
      .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
      .where(and(eq(bookings.clientId, userId), not(activeFilter)))
      .orderBy(desc(bookings.createdAt), desc(bookings.id))
      .limit(21)
      .offset((page - 1) * 20),
  ]);
  return (
    <div className="page-content max-w-5xl">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Booking history</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            All your journeys, in one place.
          </p>
        </div>
        <Link
          href="/rides"
          className="hidden items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm font-medium sm:flex"
        >
          Find a ride <ArrowUpRight size={16} />
        </Link>
      </header>
      <section aria-labelledby="active-bookings">
        <h2
          id="active-bookings"
          className="mb-4 flex items-center gap-2 text-lg font-semibold"
        >
          Active bookings{" "}
          <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-primary">
            {active.length}
          </span>
        </h2>
        {active.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {active.map((row) => (
              <BookingCard key={row.booking.id} {...row} />
            ))}
          </div>
        ) : (
          <div className="ride-surface flex items-center gap-4 p-6">
            <Ticket className="shrink-0 text-primary" size={26} />
            <div>
              <p className="text-sm font-medium">
                Your next journey is waiting.
              </p>
              <Link
                href="/rides"
                className="mt-1 inline-block text-sm text-primary underline underline-offset-4"
              >
                Find a ride
              </Link>
            </div>
          </div>
        )}
      </section>
      <section aria-labelledby="past-bookings" className="mt-4">
        <h2 id="past-bookings" className="mb-4 text-lg font-semibold">
          Past bookings
        </h2>
        {past.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {past.slice(0, 20).map((row) => (
              <BookingCard key={row.booking.id} {...row} />
            ))}
          </div>
        ) : (
          <p className="ride-surface p-6 text-sm text-muted-foreground">
            Your completed and cancelled bookings will appear here.
          </p>
        )}
      </section>
      <nav
        aria-label="Past booking pages"
        className="mt-3 flex justify-between text-sm"
      >
        {page > 1 ? (
          <Link href={`?page=${page - 1}`}>← Previous</Link>
        ) : (
          <span />
        )}
        {past.length > 20 && <Link href={`?page=${page + 1}`}>Next →</Link>}
      </nav>
    </div>
  );
}
