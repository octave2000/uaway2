import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, and, avg, count } from "drizzle-orm";
import { db } from "@/db";
import { journeys, cars, users, reviews } from "@/db/schema";
import { auth } from "@/auth";
import { RideShell } from "@/components/rides/ride-shell";
import { Notice } from "@/components/shared/notice";
import { Checkout } from "@/components/rides/checkout";
import { formatDeparture, formatKES } from "@/lib/domain/policy";
import { RouteTimeline } from "@/components/rides/route-timeline";
import { DriverSummary } from "@/components/rides/driver-summary";

export default async function Ride({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const session = await auth();
  const [row] = await db
    .select({
      journey: journeys,
      car: cars,
      driver: {
        id: users.id,
        name: users.name,
        image: users.profilePhoto,
        fallbackImage: users.image,
        verified: users.verified,
        suspended: users.suspended,
      },
    })
    .from(journeys)
    .innerJoin(cars, eq(journeys.carId, cars.id))
    .innerJoin(users, eq(journeys.driverId, users.id))
    .where(and(eq(journeys.id, id), eq(users.suspended, false)));
  if (!row) notFound();
  const { journey: j, driver, car } = row;
  const [rating] = await db
    .select({ average: avg(reviews.rating), count: count() })
    .from(reviews)
    .where(and(eq(reviews.driverId, driver.id), eq(reviews.authorRole, "passenger")));
  const available =
    j.status === "active" &&
    j.departureTime > new Date() &&
    j.seatsAvailable > 0 &&
    car.verified &&
    driver.verified;
  return (
    <RideShell>
      <Link href="/rides" className="text-sm text-primary">
        ← All rides
      </Link>
      <h1 className="mb-3 mt-6 text-3xl font-semibold">
        {j.origin} → {j.destination}
      </h1>
      <p className="mb-6 text-muted-foreground">
        {formatDeparture(j.departureTime)} · East Africa Time
      </p>
      <Notice error={error} />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="ride-surface p-6">
            <h2 className="mb-4 text-lg font-semibold">Your journey</h2>
            <RouteTimeline
              origin={j.origin}
              destination={j.destination}
              pickup={j.pickupInstructions}
              dropoff={j.dropoffInstructions}
            />
            {j.note && (
              <p className="mt-6 border-t pt-4 text-sm text-muted-foreground">
                {j.note}
              </p>
            )}
          </section>
          <section className="ride-surface p-6">
            <DriverSummary
              name={driver.name}
              image={driver.image ?? driver.fallbackImage}
              car={car.name}
              verified={driver.verified}
            />
            <p className="mt-2 text-sm">
              {rating.count
                ? `${Number(rating.average).toFixed(1)} / 5 from ${rating.count} reviews`
                : "New to Uaway — no reviews yet"}
            </p>
            <p className="mt-4 text-sm">
              {j.seatsAvailable} seats available · {j.luggageCapacity} kg
              luggage
            </p>
            {car.insuranceVerifiedAt && car.insuranceExpiry && car.insuranceExpiry > new Date() ? (
              <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Vehicle insurance verified · valid through {car.insuranceExpiry.toLocaleDateString("en-KE")}
              </p>
            ) : null}
          </section>
          <p className="text-sm leading-6 text-muted-foreground">
            Cancel before departure for a full refund. If your driver cancels,
            you receive a full refund. After departure, support reviews refund
            requests.
          </p>
        </div>
        <aside className="h-fit rounded-2xl border bg-card p-6">
          <p className="text-2xl font-semibold">
            {formatKES(j.pricePerSeat * 100)}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              / seat
            </span>
          </p>
          <p className="mb-5 mt-2 text-sm text-muted-foreground">
            Booking fee:{" "}
            {formatKES(Number(process.env.BOOKING_FEE_KES ?? 0) * 100)}
          </p>
          {!available ? (
            <p role="status">This ride is no longer available to book.</p>
          ) : !session?.user?.id ? (
            <Link
              className="block rounded-lg bg-primary p-3 text-center font-medium text-primary-foreground"
              href={`/login?callbackUrl=${encodeURIComponent(`/rides/${id}`)}`}
            >
              Sign in to reserve
            </Link>
          ) : session.user.id === driver.id ? (
            <Link href={`/dashboard/journeys/${id}/manage`}>
              Manage your journey →
            </Link>
          ) : (
            <Checkout
              journeyId={id}
              seatsAvailable={j.seatsAvailable}
              luggageCapacity={j.luggageCapacity}
              priceMinor={j.pricePerSeat * 100}
              feeMinor={Number(process.env.BOOKING_FEE_KES ?? 0) * 100}
              idempotencyKey={crypto.randomUUID()}
            />
          )}
        </aside>
      </div>
    </RideShell>
  );
}
