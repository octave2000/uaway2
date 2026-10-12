import { notFound } from "next/navigation";
import Link from "next/link";
import { and, avg, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { journeys, bookings, users, reviews } from "@/db/schema";
import { requireRole } from "@/lib/auth/roles";
import { formatDeparture } from "@/lib/domain/policy";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/shared/notice";
import { ReviewRating } from "@/components/rides/review-rating";
import { TripLocationPublisher } from "@/components/rides/trip-location-publisher";
import { EmergencyButton } from "@/components/rides/emergency-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  boardAction,
  confirmRideStartAction,
  requestRideEndAction,
  cancelJourneyAction,
  submitPassengerReviewAction,
} from "./actions";
export default async function Manage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { userId } = await requireRole("driver");
  const { id } = await params;
  const [j] = await db
    .select()
    .from(journeys)
    .where(and(eq(journeys.id, id), eq(journeys.driverId, userId)));
  if (!j) notFound();
  const passengers = await db
    .select({ b: bookings, name: users.name, image: users.profilePhoto, verified: users.verified })
    .from(bookings)
    .innerJoin(users, eq(bookings.clientId, users.id))
    .where(eq(bookings.journeyId, id));
  const passengerReviews = await db.select().from(reviews).where(and(eq(reviews.journeyId, id), eq(reviews.authorRole, "driver")));
  const reviewedPassengerIds = new Set(passengerReviews.map((review) => review.clientId));
  const passengerRatings = await db.select({ userId: reviews.clientId, average: avg(reviews.rating), total: count() }).from(reviews).where(eq(reviews.authorRole, "driver")).groupBy(reviews.clientId);
  const passengerRatingById = new Map(passengerRatings.map((rating) => [rating.userId, rating]));
  return (
    <div className="page-content">
      <Link href="/dashboard/journeys" className="text-sm text-primary">
        ← My journeys
      </Link>
      <h1 className="page-title mt-5">
        {j.origin} → {j.destination}
      </h1>
      <p className="page-description">
        {formatDeparture(j.departureTime)} · {j.status}
      </p>
      <Notice error={(await searchParams).error} />
      {j.status !== "completed" && j.status !== "cancelled" && (
        <section className="panel space-y-4">
          <h2 className="font-semibold">Live location</h2>
          <TripLocationPublisher bookingIds={passengers.filter(({ b }) => b.status === "confirmed").map(({ b }) => b.id)} />
        </section>
      )}
      <div className="panel">
        <h2 className="font-semibold">Journey controls</h2>
        <p className="my-3 text-sm text-muted-foreground">
          Check in each passenger using the code they show you. Each passenger
          confirms their own arrival.
        </p>
        <div className="flex flex-wrap gap-3">
          {j.status === "active" && (
            <>
              <form action={confirmRideStartAction}>
                <input type="hidden" name="journeyId" value={id} />
                <SubmitButton>Start journey</SubmitButton>
              </form>
              <form action={cancelJourneyAction}>
                <input type="hidden" name="journeyId" value={id} />
                <SubmitButton variant="outline">
                  Cancel and refund passengers
                </SubmitButton>
              </form>
            </>
          )}
          {j.status === "ongoing" && !j.endRequestedAt && (
            <form action={requestRideEndAction}>
              <input type="hidden" name="journeyId" value={id} />
              <SubmitButton>Request arrival confirmations</SubmitButton>
            </form>
          )}
          {j.endRequestedAt && (
            <p className="text-sm">Arrival confirmations requested.</p>
          )}
        </div>
      </div>
      <h2 className="text-xl font-semibold">Passengers</h2>
      {passengers.map(({ b, name, image, verified }) => (
        <div className="panel" key={b.id}>
          <div className="flex justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="size-10"><AvatarImage src={image ?? undefined} alt={name ?? "Passenger"} /><AvatarFallback>{(name ?? "P").slice(0, 1)}</AvatarFallback></Avatar>
              <div><h3 className="font-semibold">{name}</h3>{verified && <p className="text-xs text-primary">ID verified</p>}{passengerRatingById.has(b.clientId) && <p className="text-xs text-muted-foreground">{Number(passengerRatingById.get(b.clientId)?.average).toFixed(1)} / 5 passenger rating · {passengerRatingById.get(b.clientId)?.total} reviews</p>}</div>
            </div>
            <span className="text-sm capitalize">
              {b.status.replaceAll("_", " ")}
            </span>
          </div>
          <p className="my-3 text-sm text-muted-foreground">
            {b.seatsBooked} seats · {b.luggageSpace} kg luggage ·{" "}
            {b.boardedAt ? "Checked in" : "Not checked in"}
          </p>
          {b.status === "confirmed" &&
            !b.boardedAt &&
            j.status === "active" && (
              <form
                action={boardAction}
                className="flex flex-wrap items-end gap-3"
              >
                <input type="hidden" name="journeyId" value={id} />
                <input type="hidden" name="bookingId" value={b.id} />
                <label className="field">
                  Passenger boarding code
                  <input
                    className="control"
                    name="code"
                    maxLength={10}
                    autoComplete="off"
                    required
                  />
                </label>
                <SubmitButton>Check in</SubmitButton>
              </form>
            )}
          {b.status === "confirmed" && <EmergencyButton bookingId={b.id} />}
          <Link
            className="mt-4 block text-sm text-primary"
            href={`/dashboard/support?bookingId=${b.id}`}
          >
            Report an issue / no-show
          </Link>
          {b.status === "completed" && !reviewedPassengerIds.has(b.clientId) && (
            <form action={submitPassengerReviewAction} className="mt-4 space-y-3 border-t pt-4">
              <input type="hidden" name="journeyId" value={id} />
              <input type="hidden" name="bookingId" value={b.id} />
              <input type="hidden" name="authorRole" value="driver" />
              <p className="text-sm font-medium">Rate this passenger</p>
              <ReviewRating />
              <textarea className="control min-h-20" name="comment" maxLength={1000} placeholder="Optional feedback" />
              <SubmitButton>Submit passenger review</SubmitButton>
            </form>
          )}
        </div>
      ))}
      {!passengers.length && (
        <div className="empty-state">
          No passengers yet. Share the{" "}
          <Link href={`/rides/${id}`} className="text-primary">
            public ride page
          </Link>
          .
        </div>
      )}
    </div>
  );
}
