import { and, eq, notInArray } from "drizzle-orm";
import { ArrowLeft, Calendar, CheckCircle2, Info, MapPin, Users, Briefcase } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CarImage } from "@/components/shared/car-image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { db } from "@/db";
import { bookings, cars, journeys, users } from "@/db/schema";
import { requireRole } from "@/lib/auth/roles";

import { bookJourneyAction } from "./actions";

type JourneyDetailsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JourneyDetailsPage(props: JourneyDetailsPageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { userId } = await requireRole("passenger");

  const [data, currentUser] = await Promise.all([
    db
      .select({
        journey: journeys,
        driver: { id: users.id, name: users.name, image: users.image, verified: users.verified },
        car: {
          name: cars.name,
          plateNumber: cars.plateNumber,
          verified: cars.verified,
          photo: cars.photo,
        },
      })
      .from(journeys)
      .innerJoin(users, eq(journeys.driverId, users.id))
      .innerJoin(cars, eq(journeys.carId, cars.id))
      .where(eq(journeys.id, params.id))
      .limit(1),
    db.select({ phone: users.phone }).from(users).where(eq(users.id, userId)).limit(1),
  ]);

  if (!data[0]) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h1 className="mb-2 text-2xl font-bold">Journey Not Found</h1>
        <p className="mb-4 text-muted-foreground">This journey may have been cancelled or deleted.</p>
        <Button asChild>
          <Link href="/dashboard/journeys">Back to Journeys</Link>
        </Button>
      </div>
    );
  }

  const journeyData = data[0];

  const existingBookings = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.clientId, userId),
        eq(bookings.journeyId, params.id),
        notInArray(bookings.status, ["cancelled", "payment_failed"]),
      ),
    );

  const alreadyBooked = existingBookings.length > 0;

  if (journeyData.driver.id === userId) {
    redirect("/dashboard/journeys");
  }

  const paymentError =
    typeof searchParams.error === "string" ? searchParams.error : null;
  const hasDeparted = new Date(journeyData.journey.departureTime) <= new Date();
  const bookingUnavailable =
    journeyData.journey.status !== "active" ||
    journeyData.journey.seatsAvailable < 1 ||
    hasDeparted;

  return (
    <div className="mx-auto mb-24 flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:mb-0 md:px-8 md:py-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/journeys">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-foreground">Journey Details</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Review the route, driver details, and M-Pesa payment step before booking.
          </p>
        </div>
      </div>

      {paymentError === "payment_failed" ? (
        <Card className="rounded-[2rem] border border-rose-500/20 bg-rose-500/10 p-6">
          <div className="text-sm font-medium text-rose-700 dark:text-rose-400">
            We could not initialize the Daraja M-Pesa payment. That failed attempt was cancelled, so you can correct the phone number and try again.
          </div>
        </Card>
      ) : null}

      <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
        <CardHeader className="border-b bg-muted/20 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-2xl font-black text-foreground">
                {journeyData.journey.origin}
                <MapPin className="h-5 w-5 text-primary" />
                {journeyData.journey.destination}
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                {format(new Date(journeyData.journey.departureTime), "EEEE, MMMM do yyyy - h:mm a")}
              </div>
            </div>
            <div className="rounded-[1.25rem] bg-primary/10 px-4 py-3 text-right">
              <div className="text-3xl font-black text-primary">{journeyData.journey.pricePerSeat}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
                KES / seat
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 divide-y border-b md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="flex items-start gap-4 p-6">
              <Avatar className="mt-1 h-12 w-12 border">
                <AvatarImage src={journeyData.driver.image || undefined} />
                <AvatarFallback className="bg-muted text-lg">
                  {journeyData.driver.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Driver
                </div>
                <div className="text-lg font-bold text-foreground">{journeyData.driver.name}</div>
                {journeyData.driver.verified ? (
                  <div className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" />
                    ID verified
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex items-start gap-4 p-6">
              <CarImage
                src={journeyData.car.photo}
                alt={journeyData.car.name}
                className="h-20 w-28 rounded-[1.25rem] border border-border/50"
                sizes="160px"
              />
              <div className="space-y-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Vehicle
                </div>
                <div className="text-lg font-bold text-foreground">{journeyData.car.name}</div>
                <div className="w-fit rounded-full bg-muted px-3 py-1 text-sm font-mono text-foreground">
                  {journeyData.car.plateNumber}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 p-6">
            {journeyData.journey.note ? (
              <div className="rounded-[1.5rem] border border-border/50 bg-background/70 p-4">
                <div className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Driver note
                </div>
                <div className="text-sm font-medium leading-6 text-foreground">
                  {journeyData.journey.note}
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4 rounded-[1.5rem] border border-border/50 bg-background/60 p-4">
              <div className="flex flex-col items-center justify-center gap-1 border-r text-center">
                <Users className="mb-1 h-6 w-6 text-primary" />
                <div className="text-2xl font-black text-foreground">{journeyData.journey.seatsAvailable}</div>
                <div className="text-xs font-medium text-muted-foreground">Seats left</div>
              </div>
              <div className="flex flex-col items-center justify-center gap-1 text-center">
                <Briefcase className="mb-1 h-6 w-6 text-primary" />
                <div className="text-2xl font-black text-foreground">
                  {journeyData.journey.luggageCapacity} kg
                </div>
                <div className="text-xs font-medium text-muted-foreground">Luggage</div>
              </div>
            </div>

            {alreadyBooked ? (
              <div className="flex items-center gap-3 rounded-[1.5rem] border border-primary/20 bg-primary/10 p-5 text-primary">
                <CheckCircle2 className="h-6 w-6 shrink-0" />
                <div>
                  <div className="font-bold">You already have a booking for this journey</div>
                  <div className="text-sm opacity-90">
                    Use the bookings page to verify payment, request ride start, or complete the trip.
                  </div>
                </div>
              </div>
            ) : bookingUnavailable ? (
              <div className="rounded-[1.5rem] border border-amber-500/20 bg-amber-500/10 p-5 text-sm font-medium text-amber-700 dark:text-amber-400">
                {hasDeparted
                  ? "This ride has already departed and is no longer available for booking."
                  : journeyData.journey.seatsAvailable < 1
                    ? "This ride is fully booked."
                    : "This ride is not available for booking anymore."}
              </div>
            ) : (
              <form action={bookJourneyAction} className="space-y-4">
                <input type="hidden" name="journeyId" value={journeyData.journey.id} />
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="seatsBooked">Seats to book</Label>
                    <Input
                      id="seatsBooked"
                      name="seatsBooked"
                      type="number"
                      min={1}
                      max={journeyData.journey.seatsAvailable}
                      defaultValue={1}
                      required
                      className="rounded-2xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="luggageSpace">Luggage required (kg)</Label>
                    <Input
                      id="luggageSpace"
                      name="luggageSpace"
                      type="number"
                      min={0}
                      max={journeyData.journey.luggageCapacity}
                      defaultValue={0}
                      required
                      className="rounded-2xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentPhone">M-Pesa phone number</Label>
                  <Input
                    id="paymentPhone"
                    name="paymentPhone"
                    placeholder="07XXXXXXXX or 2547XXXXXXXX"
                    defaultValue={currentUser[0]?.phone || ""}
                    required
                    className="rounded-2xl"
                  />
                </div>
                <div className="flex items-start gap-3 rounded-[1.5rem] border border-secondary/20 bg-secondary/10 p-4">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                  <div className="text-sm text-secondary-foreground">
                    Booking now creates a pending Daraja M-Pesa charge. Your seat is confirmed only after payment verification succeeds.
                  </div>
                </div>
                {journeyData.journey.seatsAvailable > 0 ? (
                  <SubmitButton
                    type="submit"
                    size="lg"
                    className="w-full rounded-2xl text-lg font-black"
                    pendingText="Starting payment..."
                  >
                    Start M-Pesa payment
                  </SubmitButton>
                ) : (
                  <Button disabled size="lg" className="w-full rounded-2xl text-lg font-black">
                    Journey full
                  </Button>
                )}
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
