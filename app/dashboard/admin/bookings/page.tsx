import { desc, eq } from "drizzle-orm";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { bookings, journeys, payments, users } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/auth/roles";

export default async function AdminBookingsPage() {
  await requireSuperAdmin();

  const bookingRows = await db
    .select({
      booking: bookings,
      payment: payments,
      journey: {
        origin: journeys.origin,
        destination: journeys.destination,
        departureTime: journeys.departureTime,
        status: journeys.status,
      },
      passenger: {
        name: users.name,
        email: users.email,
      },
    })
    .from(bookings)
    .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
    .innerJoin(payments, eq(bookings.id, payments.bookingId))
    .innerJoin(users, eq(bookings.clientId, users.id))
    .orderBy(desc(bookings.createdAt));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <div className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Admin bookings</p>
        <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
          Booking and payment-status oversight.
        </h1>
        <p className="max-w-3xl text-sm font-medium text-muted-foreground md:text-base">
          Inspect booking codes, ride lifecycle state, and the attached payment outcome for every reservation.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {bookingRows.map(({ booking, payment, journey, passenger }) => (
          <Card key={booking.id} className="rounded-[2rem] border border-border/60 bg-card/90 shadow-sm">
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="text-xl font-black">{journey.origin} to {journey.destination}</CardTitle>
                <CardDescription className="font-medium">
                  Passenger: {passenger.name || "Unknown"} • {passenger.email}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{booking.bookingCode}</Badge>
                <Badge className="uppercase">{booking.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Departure</div><div className="mt-2 text-sm font-bold text-foreground">{format(new Date(journey.departureTime), "MMM d, yyyy h:mm a")}</div></div>
              <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Journey state</div><div className="mt-2 text-sm font-bold text-foreground">{journey.status}</div></div>
              <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Seats</div><div className="mt-2 text-sm font-bold text-foreground">{booking.seatsBooked}</div></div>
              <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Luggage</div><div className="mt-2 text-sm font-bold text-foreground">{booking.luggageSpace} kg</div></div>
              <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Payment</div><div className="mt-2 text-sm font-bold text-foreground">{payment.amount} KES</div></div>
              <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Payment status</div><div className="mt-2 text-sm font-bold text-foreground">{payment.status}</div></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
