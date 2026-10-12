import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, desc } from "drizzle-orm";
import { ArrowLeft, Phone, RotateCcw } from "lucide-react";
import { db } from "@/db";
import {
  bookings,
  journeys,
  payments,
  refunds,
  users,
  cars,
  reviews,
  trustedContacts,
} from "@/db/schema";
import { requireAuthenticatedUser } from "@/lib/auth/roles";
import { formatDeparture, formatKES } from "@/lib/domain/policy";
import { Notice } from "@/components/shared/notice";
import { StatusRefresh } from "@/components/shared/status-refresh";
import { SubmitButton } from "@/components/ui/submit-button";
import { RouteTimeline } from "@/components/rides/route-timeline";
import { DriverSummary, RatingStars } from "@/components/rides/driver-summary";
import { ReviewRating } from "@/components/rides/review-rating";
import { TripShareButton } from "@/components/rides/trip-share-button";
import { EmergencyButton } from "@/components/rides/emergency-button";
import {
  cancelBookingAction,
  confirmRideEndAction,
  submitReviewAction,
} from "../actions";

export default async function Booking({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { userId } = await requireAuthenticatedUser();
  const { id } = await params;
  const [row] = await db
    .select({
      b: bookings,
      j: journeys,
      car: cars,
      driver: {
        name: users.name,
        phone: users.phone,
        image: users.image,
        profilePhoto: users.profilePhoto,
        verified: users.verified,
      },
    })
    .from(bookings)
    .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
    .innerJoin(users, eq(journeys.driverId, users.id))
    .innerJoin(cars, eq(journeys.carId, cars.id))
    .where(and(eq(bookings.id, id), eq(bookings.clientId, userId)));
  if (!row) notFound();
  const { b, j, driver, car } = row;
  const [history, reviewRows] = await Promise.all([
    db
      .select({ payment: payments, refund: refunds })
      .from(payments)
      .leftJoin(refunds, eq(payments.id, refunds.paymentId))
      .where(eq(payments.bookingId, id))
      .orderBy(desc(payments.createdAt)),
    db
      .select()
      .from(reviews)
      .where(and(eq(reviews.journeyId, j.id), eq(reviews.clientId, userId), eq(reviews.authorRole, "passenger")))
      .limit(1),
  ]);
  const contacts = await db.select({ id: trustedContacts.id, name: trustedContacts.name, phone: trustedContacts.phone }).from(trustedContacts).where(eq(trustedContacts.userId, userId));
  const review = reviewRows[0];
  const latest = history[0]?.payment;
  const duration =
    j.startedAt && b.completedAt
      ? Math.max(
          0,
          Math.round((b.completedAt.getTime() - j.startedAt.getTime()) / 60000),
        )
      : null;
  const rebook = `/rides?${new URLSearchParams({ origin: j.origin, destination: j.destination, seats: String(b.seatsBooked) })}`;
  return (
    <div className="page-content max-w-5xl">
      <header className="mb-2 flex items-center gap-3">
        <Link
          href="/dashboard/bookings"
          aria-label="Back to booking history"
          className="flex size-11 items-center justify-center rounded-full border bg-card"
        >
          <ArrowLeft size={19} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold">Ride details</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDeparture(j.departureTime)} · EAT
          </p>
        </div>
      </header>
      <Notice error={(await searchParams).error} />
      <div className="grid items-start gap-5 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-5">
          <section
            className="ride-surface p-5"
            aria-label={`${j.origin} to ${j.destination}`}
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium capitalize">
                {b.status.replaceAll("_", " ")}
              </h2>
              <span className="fare-chip">
                {formatKES(b.fareMinor + b.feeMinor)}
              </span>
            </div>
            <RouteTimeline
              origin={j.origin}
              destination={j.destination}
              pickup={j.pickupInstructions}
              dropoff={j.dropoffInstructions}
            />
            <p className="mt-5 border-t pt-4 text-xs text-muted-foreground">
              {b.seatsBooked} {b.seatsBooked === 1 ? "seat" : "seats"} ·{" "}
              {b.luggageSpace} kg luggage
            </p>
            <StatusRefresh active={b.status === "payment_pending"} />
            {b.status === "payment_pending" && b.expiresAt && (
              <p className="mt-3 text-sm text-primary">
                Approve the M-Pesa prompt. Reservation ends{" "}
                {formatDeparture(b.expiresAt)}.
              </p>
            )}
            {b.disputedAt && (
              <p className="mt-3 text-sm text-amber-700">
                This booking has an open issue. Unsettled funds are on hold.
              </p>
            )}
          </section>
          <div className="section-divider">Details</div>
          <DriverSummary
            name={driver.name}
            image={driver.profilePhoto ?? driver.image}
            car={car.name}
            plate={car.plateNumber}
            verified={driver.verified}
          />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-6 px-1 min-[360px]:grid-cols-3">
            <div>
              <dt className="mb-2 text-xs text-muted-foreground">
                Your rating
              </dt>
              <dd>
                {review ? (
                  <RatingStars rating={review.rating} />
                ) : (
                  <span className="text-sm">Not rated yet</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="mb-2 text-xs text-muted-foreground">
                Payment method
              </dt>
              <dd className="text-sm">
                {latest?.provider === "demo"
                  ? "Demo payment"
                  : latest
                    ? "M-Pesa"
                    : "Not paid"}
              </dd>
            </div>
            <div>
              <dt className="mb-2 text-xs text-muted-foreground">
                Travel duration
              </dt>
              <dd className="text-sm">
                {duration !== null
                  ? `${Math.floor(duration / 60) ? `${Math.floor(duration / 60)}h ` : ""}${duration % 60} min`
                  : j.status === "ongoing"
                    ? "In progress"
                    : "Not recorded"}
              </dd>
            </div>
            <div>
              <dt className="mb-2 text-xs text-muted-foreground">Ride fare</dt>
              <dd className="text-sm">{formatKES(b.fareMinor)}</dd>
            </div>
            <div>
              <dt className="mb-2 text-xs text-muted-foreground">
                Booking fee
              </dt>
              <dd className="text-sm">{formatKES(b.feeMinor)}</dd>
            </div>
            <div>
              <dt className="mb-2 text-xs text-muted-foreground">Total fare</dt>
              <dd className="text-sm font-semibold">
                {formatKES(b.fareMinor + b.feeMinor)}
              </dd>
            </div>
          </dl>
          {b.status === "completed" &&
            (review ? (
              <section>
                <h2 className="mb-2 text-sm text-muted-foreground">
                  Your feedback
                </h2>
                <div className="ride-surface min-h-32 p-4 text-sm leading-relaxed">
                  {review.comment ||
                    "You left a rating without a written review."}
                </div>
              </section>
            ) : (
              <form
                action={submitReviewAction}
                className="ride-surface space-y-4 p-5"
              >
                <h2 className="font-medium">How was your ride?</h2>
                <input type="hidden" name="bookingId" value={id} />
                <ReviewRating />
                <label className="field">
                  Feedback
                  <textarea
                    name="comment"
                    maxLength={1000}
                    className="control min-h-32 bg-card"
                    placeholder="Tell us about your journey…"
                  />
                </label>
                <SubmitButton className="w-full">Submit review</SubmitButton>
              </form>
            ))}
        </div>
        <div className="space-y-5">
          {b.status === "confirmed" && (
            <section className="ride-surface p-5">
              <p className="text-sm text-muted-foreground">
                {b.boardedAt
                  ? "Checked in"
                  : "Show your driver this boarding code"}
              </p>
              <p className="my-4 rounded-xl border border-dashed bg-accent p-5 text-center font-mono text-3xl font-semibold tracking-[0.2em] text-primary">
                {b.bookingCode}
              </p>
              {driver.phone && (
                <a
                  href={`tel:${driver.phone}`}
                  className="flex min-h-11 items-center justify-center gap-2 rounded-full border text-sm font-medium"
                >
                  <Phone size={16} />
                  Call your driver
                </a>
              )}
              {driver.phone && <p className="text-center text-xs text-muted-foreground">Direct call uses your phone app; your number may be visible to each other.</p>}
              <TripShareButton bookingId={id} contacts={contacts} />
              <EmergencyButton bookingId={id} />
            </section>
          )}
          <section className="ride-surface p-5">
            <h2 className="mb-4 font-medium">Payment history</h2>
            {!history.length && (
              <p className="text-sm text-muted-foreground">
                No payment recorded yet.
              </p>
            )}
            {history.map(({ payment: p, refund: r }) => (
              <div key={p.id} className="border-t py-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="capitalize">
                    {p.provider === "demo" ? "Demo" : "M-Pesa"} · {p.status}
                  </span>
                  <strong className="font-medium">
                    {formatKES(p.amountMinor)}
                  </strong>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {p.providerStatus === "initiation_unknown"
                    ? "Payment outcome needs a support check. Please do not pay again."
                    : p.status === "pending"
                      ? "Waiting for payment verification"
                      : p.status === "failed"
                        ? "Payment was not completed"
                        : p.status === "refunded"
                          ? "Payment refunded"
                          : p.provider === "demo"
                            ? "Sample payment for testing"
                            : "Payment verified"}
                </p>
                {r && (
                  <p className="mt-2 text-xs">
                    Refund: {r.status} ·{" "}
                    {r.externalReference ?? "Awaiting processing"}
                  </p>
                )}
              </div>
            ))}
          </section>
          <div className="space-y-3">
            {b.status === "confirmed" && b.boardedAt && j.endRequestedAt && (
              <form action={confirmRideEndAction}>
                <input type="hidden" name="bookingId" value={id} />
                <SubmitButton className="h-12 w-full">
                  Confirm my arrival
                </SubmitButton>
              </form>
            )}
            {["completed", "cancelled", "payment_failed"].includes(b.status) &&
              !history.some(
                (x) => x.payment.providerStatus === "initiation_unknown",
              ) && (
                <Link
                  href={rebook}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
                >
                  <RotateCcw size={17} />
                  Book this route again
                </Link>
              )}
            {["payment_pending", "confirmed"].includes(b.status) &&
              j.status === "active" &&
              j.departureTime > new Date() && (
                <form action={cancelBookingAction}>
                  <input type="hidden" name="bookingId" value={id} />
                  <SubmitButton variant="outline" className="w-full">
                    Cancel booking — full refund
                  </SubmitButton>
                </form>
              )}
            <Link
              href={`/dashboard/support?bookingId=${id}`}
              className="flex min-h-11 items-center justify-center text-sm text-muted-foreground underline underline-offset-4"
            >
              Report a problem
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
