import { desc, eq } from "drizzle-orm";
import { format } from "date-fns";

import { updatePayoutRequestStatusAction } from "@/app/dashboard/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { db } from "@/db";
import { bookings, journeys, payments, payoutRequests, users } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/auth/roles";

export default async function AdminPaymentsPage() {
  await requireSuperAdmin();

  const [paymentRows, payoutRows] = await Promise.all([
    db
      .select({
        payment: payments,
        journey: {
          origin: journeys.origin,
          destination: journeys.destination,
          departureTime: journeys.departureTime,
        },
        passenger: {
          name: users.name,
          email: users.email,
        },
      })
      .from(payments)
      .innerJoin(bookings, eq(payments.bookingId, bookings.id))
      .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
      .innerJoin(users, eq(bookings.clientId, users.id))
      .orderBy(desc(payments.createdAt)),
    db
      .select({
        request: payoutRequests,
        journey: {
          origin: journeys.origin,
          destination: journeys.destination,
        },
        driver: {
          name: users.name,
          email: users.email,
        },
      })
      .from(payoutRequests)
      .innerJoin(bookings, eq(payoutRequests.bookingId, bookings.id))
      .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
      .innerJoin(users, eq(payoutRequests.driverId, users.id))
      .orderBy(desc(payoutRequests.createdAt)),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <div className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Admin payments</p>
        <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
          Payments, payout requests, and settlement flow.
        </h1>
        <p className="max-w-3xl text-sm font-medium text-muted-foreground md:text-base">
          Review recent transactions and work payout requests through approval, rejection, and paid status.
        </p>
      </div>

      <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-black">Payout requests</CardTitle>
          <CardDescription className="font-medium">
            These requests need operational follow-through after passenger and driver actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          {payoutRows.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border/60 bg-muted/10 p-8 text-sm font-medium text-muted-foreground">
              No payout requests yet.
            </div>
          ) : (
            payoutRows.map(({ request, journey, driver }) => (
              <div key={request.id} className="rounded-[1.5rem] border border-border/50 bg-background/70 p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="font-bold text-foreground">{journey.origin} to {journey.destination}</div>
                  <Badge className="uppercase">{request.status}</Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Driver</div><div className="mt-2 text-sm font-bold text-foreground">{driver.name || "Unknown"}</div><div className="text-xs font-medium text-muted-foreground">{driver.email}</div></div>
                  <div><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Amount</div><div className="mt-2 text-sm font-bold text-foreground">{request.amount} KES</div><div className="text-xs font-medium text-muted-foreground">{request.type} payout</div></div>
                </div>
                {request.note ? (
                  <div className="mt-4 rounded-[1.25rem] border border-border/40 bg-card p-4 text-sm font-medium text-muted-foreground">
                    {request.note}
                  </div>
                ) : null}
                {request.status === "pending" ? (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <form action={updatePayoutRequestStatusAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="status" value="approved" />
                      <SubmitButton className="rounded-2xl font-black uppercase tracking-[0.18em]" pendingText="Approving...">
                        Approve request
                      </SubmitButton>
                    </form>
                    <form action={updatePayoutRequestStatusAction}>
                      <input type="hidden" name="requestId" value={request.id} />
                      <input type="hidden" name="status" value="rejected" />
                      <SubmitButton variant="outline" className="rounded-2xl font-black uppercase tracking-[0.18em]" pendingText="Rejecting...">
                        Reject request
                      </SubmitButton>
                    </form>
                  </div>
                ) : request.status === "approved" ? (
                  <form action={updatePayoutRequestStatusAction} className="mt-4">
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="status" value="paid" />
                    <SubmitButton className="rounded-2xl font-black uppercase tracking-[0.18em]" pendingText="Marking paid...">
                      Mark as paid
                    </SubmitButton>
                  </form>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-black">Recent payment activity</CardTitle>
          <CardDescription className="font-medium">
            Latest transactions with route and passenger context.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          {paymentRows.map(({ payment, journey, passenger }) => (
            <div key={payment.id} className="rounded-[1.5rem] border border-border/50 bg-background/70 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="font-bold text-foreground">{journey.origin} to {journey.destination}</div>
                <Badge
                  className={
                    payment.status === "success"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                      : payment.status === "failed"
                        ? "border-rose-500/20 bg-rose-500/10 text-rose-600"
                        : "border-amber-500/20 bg-amber-500/10 text-amber-600"
                  }
                >
                  {payment.status}
                </Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Passenger</div><div className="mt-2 text-sm font-bold text-foreground">{passenger.name || "Unknown"}</div><div className="text-xs font-medium text-muted-foreground">{passenger.email}</div></div>
                <div><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Amount</div><div className="mt-2 text-sm font-bold text-foreground">{payment.amount} KES</div><div className="text-xs font-medium text-muted-foreground">{payment.paymentMethod}</div></div>
                <div><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Created</div><div className="mt-2 text-sm font-bold text-foreground">{format(new Date(payment.createdAt ?? new Date()), "MMM d, yyyy h:mm a")}</div></div>
                <div><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Provider</div><div className="mt-2 text-sm font-bold text-foreground">{payment.providerStatus || payment.status}</div></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
