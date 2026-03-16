import { and, desc, eq, inArray } from "drizzle-orm";
import { ArrowLeft, CheckCircle2, Clock3, QrCode, ShieldCheck, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { bookings, journeys, payments, payoutRequests, users } from "@/db/schema";
import { requireRole } from "@/lib/auth/roles";
import { autoCompleteExpiredJourneys } from "@/lib/journeys/lifecycle";

import { confirmRideStartAction, requestRideEndAction } from "./actions";

export default async function ManageJourneyPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { userId } = await requireRole("driver");

  await autoCompleteExpiredJourneys();

  const [journey] = await db
    .select()
    .from(journeys)
    .where(eq(journeys.id, params.id))
    .limit(1);

  if (!journey || journey.driverId !== userId) {
    redirect("/dashboard/journeys");
  }

  const journeyBookings = await db
    .select({
      booking: bookings,
      client: { name: users.name, phone: users.phone, image: users.image, id: users.id },
      payment: payments,
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.clientId, users.id))
    .innerJoin(payments, eq(bookings.id, payments.bookingId))
    .where(eq(bookings.journeyId, params.id))
    .orderBy(desc(bookings.createdAt));

  const bookingIds = journeyBookings.map((bookingRecord) => bookingRecord.booking.id);
  const advanceRequests = bookingIds.length
    ? await db
        .select()
        .from(payoutRequests)
        .where(
          and(
            eq(payoutRequests.driverId, userId),
            eq(payoutRequests.type, "advance"),
            inArray(payoutRequests.bookingId, bookingIds),
          ),
        )
    : [];

  const totalEarned = journeyBookings.reduce((acc, current) => acc + current.payment.amount, 0);
  const startRequester = journeyBookings.find(
    (bookingRecord) => bookingRecord.client.id === journey.startRequestedByClientId,
  );
  const pendingAdvanceApprovals = advanceRequests.filter(
    (request) => request.type === "advance" && request.status === "pending",
  ).length;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:gap-8 md:px-8 md:py-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/journeys">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Manage Journey</h1>
          <p className="text-sm font-medium text-muted-foreground">
            {journey.origin} to {journey.destination}
          </p>
        </div>
        <Badge className="ml-auto uppercase">{journey.status}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <Users className="h-4 w-4 text-primary" />
              Passengers
            </div>
            <div className="text-4xl font-black text-foreground">{journeyBookings.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <Wallet className="h-4 w-4 text-primary" />
              Collected
            </div>
            <div className="text-4xl font-black text-foreground">{totalEarned} KES</div>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <Clock3 className="h-4 w-4 text-primary" />
              Pending approvals
            </div>
            <div className="text-4xl font-black text-foreground">{pendingAdvanceApprovals}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-black">
              <Users className="h-5 w-5" />
              Passenger list
            </CardTitle>
            <CardDescription className="font-medium">
              Monitor confirmed riders, booking codes, and payment amounts for this trip.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {journeyBookings.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-border/60 bg-muted/10 p-8 text-center text-sm font-medium text-muted-foreground">
                No passenger bookings yet.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {journeyBookings.map((bookingRecord) => (
                  <div
                    key={bookingRecord.booking.id}
                    className="flex flex-col gap-4 rounded-[1.5rem] border border-border/50 bg-background/70 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 border">
                        <AvatarImage src={bookingRecord.client.image || undefined} />
                        <AvatarFallback className="bg-muted text-sm font-black">
                          {bookingRecord.client.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="font-bold text-foreground">{bookingRecord.client.name}</div>
                        <div className="text-xs font-medium text-muted-foreground">
                          {bookingRecord.client.phone || "No phone"} • {bookingRecord.booking.seatsBooked} seat(s)
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 md:justify-end">
                      <Badge variant="outline" className="font-mono">
                        <QrCode className="mr-1 h-3 w-3" />
                        {bookingRecord.booking.bookingCode}
                      </Badge>
                      <Badge
                        className={
                          bookingRecord.payment.status === "success"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                            : "border-amber-500/20 bg-amber-500/10 text-amber-600"
                        }
                      >
                        {bookingRecord.payment.status}
                      </Badge>
                      <span className="text-sm font-black text-primary">
                        +{bookingRecord.payment.amount} KES
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-black">Lifecycle controls</CardTitle>
              <CardDescription className="font-medium">
                Handle the current ride state based on passenger and driver confirmations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {journey.status === "active" && !journey.startRequestedAt ? (
                <div className="rounded-[1.5rem] border border-border/50 bg-muted/10 p-4 text-sm font-medium text-muted-foreground">
                  Waiting for a passenger to request the start of the ride.
                </div>
              ) : null}

              {journey.status === "active" && journey.startRequestedAt ? (
                <div className="space-y-4 rounded-[1.5rem] border border-primary/20 bg-primary/5 p-4">
                  <div className="space-y-1">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                      Start request received
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {startRequester?.client.name || "A passenger"} is ready to begin the trip.
                    </div>
                  </div>
                  <form action={confirmRideStartAction}>
                    <input type="hidden" name="journeyId" value={journey.id} />
                    <Button type="submit" className="w-full rounded-2xl font-black uppercase tracking-[0.18em]">
                      Confirm ride start
                    </Button>
                  </form>
                </div>
              ) : null}

              {journey.status === "ongoing" && !journey.endRequestedAt ? (
                <form action={requestRideEndAction}>
                  <input type="hidden" name="journeyId" value={journey.id} />
                  <Button type="submit" className="w-full rounded-2xl font-black uppercase tracking-[0.18em]">
                    Request ride end
                  </Button>
                </form>
              ) : null}

              {journey.status === "ongoing" && journey.endRequestedAt ? (
                <div className="rounded-[1.5rem] border border-amber-500/20 bg-amber-500/10 p-4 text-sm font-medium text-amber-700 dark:text-amber-400">
                  End request sent. Waiting for a passenger to confirm trip completion.
                </div>
              ) : null}

              {journey.status === "completed" ? (
                <div className="flex items-center gap-3 rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <div className="text-sm font-bold">Journey completed and payouts can progress.</div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Driver note
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-medium text-muted-foreground">
              Confirm start only after passengers are in the vehicle. Request end when the trip is complete so passengers can close it from their booking screen.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
