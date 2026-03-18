import { desc, eq, sql } from "drizzle-orm";
import { Calendar, Clock3, CreditCard, ShieldCheck, Wallet } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { bookings, journeys, payments, payoutRequests, users } from "@/db/schema";
import { requireRole } from "@/lib/auth/roles";
import { autoCompleteExpiredJourneys } from "@/lib/journeys/lifecycle";

import {
  requestAdvancePayoutAction,
  requestStandardPayoutAction,
} from "./actions";

const PAYOUT_RELEASE_DELAY_MS = 6 * 60 * 60 * 1000;

function toTime(value: Date | string | null | undefined) {
  if (!value) {
    return 0;
  }

  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

function getPaymentTone(status: "pending" | "success" | "failed" | "refunded") {
  switch (status) {
    case "success":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600";
    case "pending":
      return "border-amber-500/20 bg-amber-500/10 text-amber-600";
    case "failed":
      return "border-rose-500/20 bg-rose-500/10 text-rose-600";
    case "refunded":
      return "border-slate-500/20 bg-slate-500/10 text-slate-600";
  }
}

export default async function PaymentsPage() {
  const { userId } = await requireRole("driver");

  await autoCompleteExpiredJourneys();

  const paymentRows = await db
    .select({
      payment: payments,
      currentTime: sql<Date>`CURRENT_TIMESTAMP`,
      booking: bookings,
      journey: {
        id: journeys.id,
        origin: journeys.origin,
        destination: journeys.destination,
        departureTime: journeys.departureTime,
        status: journeys.status,
      },
      passenger: {
        name: users.name,
      },
    })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
    .innerJoin(users, eq(bookings.clientId, users.id))
    .where(eq(journeys.driverId, userId))
    .orderBy(desc(payments.createdAt));

  const requests = await db
    .select()
    .from(payoutRequests)
    .where(eq(payoutRequests.driverId, userId))
    .orderBy(desc(payoutRequests.createdAt));

  const latestRequestByPaymentId = new Map<string, (typeof requests)[number]>();

  for (const request of requests) {
    if (!latestRequestByPaymentId.has(request.paymentId)) {
      latestRequestByPaymentId.set(request.paymentId, request);
    }
  }

  const totals = paymentRows.reduce(
    (acc, row) => {
      const paidAt = toTime(row.payment.paidAt) || toTime(row.payment.createdAt);
      const currentTime = toTime(row.currentTime);
      const payoutReady =
        row.payment.status === "success" &&
        row.journey.status === "completed" &&
        currentTime - paidAt >= PAYOUT_RELEASE_DELAY_MS;

      if (row.payment.status === "success") {
        acc.collected += row.payment.amount;
      }

      if (payoutReady) {
        acc.ready += row.payment.amount;
      } else if (row.payment.status === "success") {
        acc.locked += row.payment.amount;
      }

      return acc;
    },
    { collected: 0, ready: 0, locked: 0 },
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:gap-8 md:px-8 md:py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">
            Driver Payments
          </p>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
            Track incoming payments and request payouts.
          </h1>
          <p className="max-w-2xl text-sm font-medium text-muted-foreground md:text-base">
            Standard payouts unlock after completed trips plus the 6-hour release window. Advance requests can be sent while a ride is ongoing and need passenger approval.
          </p>
        </div>
        <Card className="rounded-[1.75rem] border-border/60 bg-card/90 shadow-sm">
          <CardContent className="flex items-center gap-3 p-5">
            <ShieldCheck className="h-10 w-10 rounded-2xl bg-primary/10 p-2 text-primary" />
            <div className="space-y-1">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                Payout rule
              </div>
              <div className="text-sm font-bold text-foreground">
                Advance payouts wait for passenger approval. Standard payouts unlock after 6 hours.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <CreditCard className="h-4 w-4 text-primary" />
              Total collected
            </div>
            <div className="text-4xl font-black text-foreground">{totals.collected} KES</div>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <Wallet className="h-4 w-4 text-primary" />
              Ready for payout
            </div>
            <div className="text-4xl font-black text-foreground">{totals.ready} KES</div>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <Clock3 className="h-4 w-4 text-primary" />
              Locked
            </div>
            <div className="text-4xl font-black text-foreground">{totals.locked} KES</div>
          </CardContent>
        </Card>
      </div>

      {paymentRows.length === 0 ? (
        <Card className="rounded-[2rem] border-dashed border-border/60 bg-muted/10 p-10 text-center">
          <CardTitle className="mb-3 text-2xl font-black">No payment activity yet</CardTitle>
          <CardDescription className="mx-auto mb-6 max-w-md text-sm font-medium">
            Booking payments, payout requests, and release eligibility will appear here as passengers complete your trips.
          </CardDescription>
          <Button asChild className="mx-auto rounded-2xl px-8 text-sm font-black uppercase tracking-[0.18em]">
            <Link href="/dashboard/journeys/new">Post a journey</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {paymentRows.map((row) => {
            const latestRequest = latestRequestByPaymentId.get(row.payment.id);
            const paidAt = toTime(row.payment.paidAt) || toTime(row.payment.createdAt);
            const currentTime = toTime(row.currentTime);
            const standardEligible =
              row.payment.status === "success" &&
              row.journey.status === "completed" &&
              currentTime - paidAt >= PAYOUT_RELEASE_DELAY_MS;
            const advanceEligible =
              row.payment.status === "success" &&
              row.booking.status === "confirmed" &&
              row.journey.status === "ongoing";

            return (
              <Card key={row.payment.id} className="rounded-[2rem] border border-border/60 bg-card/90 shadow-sm">
                <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className={getPaymentTone(row.payment.status)}>{row.payment.status}</Badge>
                      {latestRequest ? (
                        <Badge variant="outline">
                          {latestRequest.type} request: {latestRequest.status}
                        </Badge>
                      ) : null}
                    </div>
                    <div>
                      <div className="text-2xl font-black text-foreground">
                        {row.journey.origin} to {row.journey.destination}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          {format(new Date(row.journey.departureTime), "MMM d, h:mm a")}
                        </span>
                        <span>Passenger: {row.passenger.name ?? "Passenger"}</span>
                        <span>Status: {row.journey.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex min-w-[260px] flex-col gap-4 rounded-[1.5rem] border border-border/50 bg-background/70 p-5">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        Amount
                      </div>
                      <div className="text-3xl font-black text-primary">{row.payment.amount} KES</div>
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {standardEligible
                        ? "This payment is eligible for a standard payout request."
                        : advanceEligible
                          ? "This payment can be used for an advance request while the ride is ongoing."
                          : "This payment is still locked by ride state or release timing."}
                    </div>
                    {standardEligible && !latestRequest ? (
                      <form action={requestStandardPayoutAction}>
                        <input type="hidden" name="paymentId" value={row.payment.id} />
                        <Button type="submit" className="w-full rounded-2xl font-black uppercase tracking-[0.18em]">
                          Request standard payout
                        </Button>
                      </form>
                    ) : null}
                    {advanceEligible && !latestRequest ? (
                      <form action={requestAdvancePayoutAction}>
                        <input type="hidden" name="paymentId" value={row.payment.id} />
                        <Button type="submit" variant="outline" className="w-full rounded-2xl font-black uppercase tracking-[0.18em]">
                          Request advance payout
                        </Button>
                      </form>
                    ) : null}
                    <Button asChild variant="outline" className="rounded-2xl">
                      <Link href={`/dashboard/journeys/${row.journey.id}/manage`}>View journey</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
