import { and, desc, eq, inArray } from "drizzle-orm";
import { Calendar, Clock3, QrCode, ShieldCheck, Star, Wallet } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/db";
import { bookings, cars, journeys, payments, payoutRequests, reviews, users } from "@/db/schema";
import { requireRole } from "@/lib/auth/roles";
import { autoCompleteExpiredJourneys } from "@/lib/journeys/lifecycle";

import {
  approveAdvancePayoutAction,
  checkPaymentStatusAction,
  confirmRideEndAction,
  rejectAdvancePayoutAction,
  requestRideStartAction,
  submitReviewAction,
} from "./actions";

type BookingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getBookingTone(label: string) {
  switch (label) {
    case "payment pending":
      return "border-amber-500/20 bg-amber-500/10 text-amber-600";
    case "payment failed":
      return "border-rose-500/20 bg-rose-500/10 text-rose-600";
    case "ride ongoing":
      return "border-primary/20 bg-primary/10 text-primary";
    case "ride completed":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600";
    default:
      return "border-border/60 bg-muted/20 text-foreground";
  }
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const params = await searchParams;
  const { userId } = await requireRole("passenger");

  await autoCompleteExpiredJourneys();

  const userBookings = await db
    .select({
      booking: bookings,
      journey: journeys,
      driver: { id: users.id, name: users.name, phone: users.phone },
      car: { name: cars.name, plateNumber: cars.plateNumber },
      payment: payments,
    })
    .from(bookings)
    .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
    .innerJoin(users, eq(journeys.driverId, users.id))
    .innerJoin(cars, eq(journeys.carId, cars.id))
    .innerJoin(payments, eq(bookings.id, payments.bookingId))
    .where(eq(bookings.clientId, userId))
    .orderBy(desc(bookings.createdAt));

  const userReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.clientId, userId));

  const reviewedJourneyIds = new Set(userReviews.map((review) => review.journeyId));
  const bookingIds = userBookings.map((item) => item.booking.id);

  const advanceRequests = bookingIds.length
    ? await db
        .select()
        .from(payoutRequests)
        .where(and(eq(payoutRequests.clientId, userId), eq(payoutRequests.type, "advance"), inArray(payoutRequests.bookingId, bookingIds)))
        .orderBy(desc(payoutRequests.createdAt))
    : [];

  const latestAdvanceRequestByBookingId = new Map<string, (typeof advanceRequests)[number]>();

  for (const request of advanceRequests) {
    if (!latestAdvanceRequestByBookingId.has(request.bookingId)) {
      latestAdvanceRequestByBookingId.set(request.bookingId, request);
    }
  }

  const notice = typeof params.notice === "string" ? params.notice : null;

  return (
    <div className="mx-auto mb-20 flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:mb-0 md:gap-8 md:px-8 md:py-8">
      <div className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">
          Passenger Control Center
        </p>
        <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
          Manage payments, ride actions, and reviews.
        </h1>
        <p className="max-w-2xl text-sm font-medium text-muted-foreground md:text-base">
          This page now handles the full passenger flow: payment verification, start requests, end confirmation, and advance payout approvals.
        </p>
      </div>

      {notice === "payment_pending" ? (
        <Card className="rounded-[2rem] border border-amber-500/20 bg-amber-500/10 p-6">
          <div className="flex items-start gap-3 text-amber-700 dark:text-amber-400">
            <Clock3 className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="space-y-1">
              <div className="font-black uppercase tracking-[0.18em] text-xs">Payment initiated</div>
              <div className="text-sm font-medium">
                Your M-Pesa charge was created. Use the booking card below to check payment status after authorizing it on your phone.
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {userBookings.length === 0 ? (
        <Card className="mt-4 flex flex-col items-center justify-center rounded-[2rem] border-dashed bg-muted/20 p-12 text-center">
          <CardTitle className="mb-3 text-2xl font-black">No bookings yet</CardTitle>
          <CardDescription className="mb-6 max-w-md text-sm font-medium">
            Browse rides and your confirmed trips, payment statuses, and ride controls will appear here.
          </CardDescription>
          <Button asChild className="rounded-2xl px-8 text-sm font-black uppercase tracking-[0.18em]">
            <Link href="/dashboard/journeys">Explore rides</Link>
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {userBookings.map((data) => {
            const latestAdvanceRequest = latestAdvanceRequestByBookingId.get(data.booking.id);
            const isReviewed = reviewedJourneyIds.has(data.journey.id);
            const isCompleted = data.journey.status === "completed";

            const lifecycleLabel =
              data.booking.status === "payment_pending"
                ? "payment pending"
                : data.booking.status === "payment_failed"
                  ? "payment failed"
                  : isCompleted
                    ? "ride completed"
                    : data.journey.status === "ongoing"
                      ? "ride ongoing"
                      : "confirmed";

            return (
              <Card
                key={data.booking.id}
                className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 shadow-sm"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="relative flex shrink-0 flex-col items-center justify-center gap-3 border-b bg-primary/5 p-8 text-center md:w-1/3 md:border-b-0 md:border-r">
                    <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
                    <QrCode className="h-16 w-16 text-primary" />
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        Booking code
                      </div>
                      <div className="font-mono text-4xl font-black tracking-widest text-primary">
                        {data.booking.bookingCode}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-6 p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="text-2xl font-black text-foreground">
                          {data.journey.origin} to {data.journey.destination}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            {format(new Date(data.journey.departureTime), "PPP 'at' p")}
                          </span>
                          <span>Driver: {data.driver.name}</span>
                        </div>
                      </div>
                      <Badge className={getBookingTone(lifecycleLabel)}>{lifecycleLabel}</Badge>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                          Contact
                        </div>
                        <div className="text-sm font-bold text-foreground">{data.driver.phone || "N/A"}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                          Vehicle
                        </div>
                        <div className="text-sm font-bold text-foreground">{data.car.name}</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                          Payment
                        </div>
                        <div className="text-sm font-bold text-foreground">{data.payment.amount} KES</div>
                      </div>
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                          Provider status
                        </div>
                        <div className="text-sm font-bold text-foreground">
                          {data.payment.providerStatus || data.payment.status}
                        </div>
                      </div>
                    </div>

                    {data.booking.status === "payment_pending" ? (
                      <div className="rounded-[1.5rem] border border-amber-500/20 bg-amber-500/10 p-5">
                        <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400">
                          <Clock3 className="h-4 w-4" />
                          Waiting for M-Pesa confirmation
                        </div>
                        <form action={checkPaymentStatusAction}>
                          <input type="hidden" name="bookingId" value={data.booking.id} />
                          <Button type="submit" className="rounded-2xl font-black uppercase tracking-[0.18em]">
                            Check payment status
                          </Button>
                        </form>
                      </div>
                    ) : null}

                    {data.booking.status === "payment_failed" ? (
                      <div className="rounded-[1.5rem] border border-rose-500/20 bg-rose-500/10 p-5 text-sm font-medium text-rose-700 dark:text-rose-400">
                        Your payment did not confirm. You can return to the journeys page and create a fresh booking when ready.
                      </div>
                    ) : null}

                    {data.booking.status === "confirmed" &&
                    data.journey.status === "active" &&
                    !data.journey.startRequestedAt ? (
                      <div className="rounded-[1.5rem] border border-primary/20 bg-primary/5 p-5">
                        <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-primary">
                          <ShieldCheck className="h-4 w-4" />
                          Ready to begin?
                        </div>
                        <form action={requestRideStartAction}>
                          <input type="hidden" name="bookingId" value={data.booking.id} />
                          <Button type="submit" className="rounded-2xl font-black uppercase tracking-[0.18em]">
                            Request ride start
                          </Button>
                        </form>
                      </div>
                    ) : null}

                    {data.booking.status === "confirmed" &&
                    data.journey.status === "active" &&
                    data.journey.startRequestedAt ? (
                      <div className="rounded-[1.5rem] border border-primary/20 bg-primary/5 p-5 text-sm font-medium text-primary">
                        Start request recorded. Waiting for the driver to confirm and move the trip to ongoing.
                      </div>
                    ) : null}

                    {data.booking.status === "confirmed" &&
                    data.journey.status === "ongoing" &&
                    !data.journey.endRequestedAt ? (
                      <div className="rounded-[1.5rem] border border-primary/20 bg-primary/5 p-5 text-sm font-medium text-primary">
                        Ride is ongoing. The driver will request trip completion when you arrive.
                      </div>
                    ) : null}

                    {data.booking.status === "confirmed" &&
                    data.journey.status === "ongoing" &&
                    data.journey.endRequestedAt ? (
                      <div className="rounded-[1.5rem] border border-amber-500/20 bg-amber-500/10 p-5">
                        <div className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400">
                          Driver requested trip completion
                        </div>
                        <form action={confirmRideEndAction}>
                          <input type="hidden" name="bookingId" value={data.booking.id} />
                          <Button type="submit" className="rounded-2xl font-black uppercase tracking-[0.18em]">
                            Confirm ride end
                          </Button>
                        </form>
                      </div>
                    ) : null}

                    {latestAdvanceRequest ? (
                      <div className="rounded-[1.5rem] border border-secondary/20 bg-secondary/5 p-5">
                        <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-secondary">
                          <Wallet className="h-4 w-4" />
                          Advance payout request
                        </div>
                        <div className="mb-4 text-sm font-medium text-muted-foreground">
                          Status: <span className="font-black text-foreground">{latestAdvanceRequest.status}</span>
                        </div>
                        {latestAdvanceRequest.status === "pending" ? (
                          <div className="flex flex-col gap-3 md:flex-row">
                            <form action={approveAdvancePayoutAction} className="flex-1">
                              <input type="hidden" name="payoutRequestId" value={latestAdvanceRequest.id} />
                              <Button type="submit" className="w-full rounded-2xl font-black uppercase tracking-[0.18em]">
                                Approve request
                              </Button>
                            </form>
                            <form action={rejectAdvancePayoutAction} className="flex-1">
                              <input type="hidden" name="payoutRequestId" value={latestAdvanceRequest.id} />
                              <Button type="submit" variant="outline" className="w-full rounded-2xl font-black uppercase tracking-[0.18em]">
                                Reject request
                              </Button>
                            </form>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {isCompleted && !isReviewed ? (
                      <div className="rounded-[1.5rem] border border-secondary/20 bg-secondary/5 p-5">
                        <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-secondary">
                          <Star className="h-4 w-4 fill-secondary" />
                          Rate your experience
                        </div>
                        <form action={submitReviewAction} className="flex flex-col gap-4">
                          <input type="hidden" name="journeyId" value={data.journey.id} />
                          <input type="hidden" name="driverId" value={data.driver.id} />
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">Rating (1-5)</Label>
                            <div className="flex items-center gap-3">
                              {[1, 2, 3, 4, 5].map((value) => (
                                <label key={value} className="cursor-pointer group">
                                  <input type="radio" name="rating" value={value} required className="sr-only peer" />
                                  <Star className="h-8 w-8 text-muted-foreground/30 transition-all group-hover:scale-110 peer-checked:fill-yellow-500 peer-checked:text-yellow-500" />
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground">Comment</Label>
                            <Input name="comment" placeholder="Tell us about the trip..." className="rounded-2xl" />
                          </div>
                          <Button type="submit" className="rounded-2xl font-black uppercase tracking-[0.18em]">
                            Submit review
                          </Button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
