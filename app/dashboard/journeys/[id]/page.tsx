import { db } from "@/db";
import { journeys, users, cars, bookings } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Calendar, MapPin, Users, Briefcase, Info, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { format } from "date-fns";
import { bookJourneyAction } from "./actions";
import { requireRole } from "@/lib/auth/roles";

export default async function JourneyDetailsPage(
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { userId } = await requireRole("passenger");

  const [data] = await db
    .select({
      journey: journeys,
      driver: { id: users.id, name: users.name, image: users.image, verified: users.verified },
      car: { name: cars.name, plateNumber: cars.plateNumber, verified: cars.verified }
    })
    .from(journeys)
    .innerJoin(users, eq(journeys.driverId, users.id))
    .innerJoin(cars, eq(journeys.carId, cars.id))
    .where(eq(journeys.id, params.id))
    .limit(1);

  if (!data) {
    return (
       <div className="flex flex-col items-center justify-center p-12 text-center">
         <h1 className="text-2xl font-bold mb-2">Journey Not Found</h1>
         <p className="text-muted-foreground mb-4">This journey may have been cancelled or deleted.</p>
         <Button asChild><Link href="/dashboard/journeys">Back to Journeys</Link></Button>
       </div>
    );
  }
  
  // Check if current user already booked this journey
  const existingBookings = await db.select().from(bookings).where(
    and(eq(bookings.clientId, userId), eq(bookings.journeyId, params.id))
  );
  
  const alreadyBooked = existingBookings.length > 0;
  
  // Check if current user is the driver
  if (data.driver.id === userId) {
     redirect("/dashboard/journeys");
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-3xl mx-auto mb-24 md:mb-0">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/journeys">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Journey Details</h1>
          <p className="text-muted-foreground text-sm">Review the route and driver details before booking.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-muted/30 border-b">
           <div className="flex justify-between items-start">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xl font-bold">
                  {data.journey.origin} <MapPin className="w-5 h-5 text-primary" /> {data.journey.destination}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground font-medium">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(data.journey.departureTime), "EEEE, MMMM do yyyy - hh:mm a")}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 bg-primary/10 px-4 py-2 rounded-lg">
                <span className="text-2xl font-black text-primary">{data.journey.pricePerSeat}</span>
                <span className="text-xs font-semibold text-primary/70 uppercase tracking-widest">KES / Seat</span>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-0">
           <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b">
              <div className="p-6 flex items-start gap-4">
                 <Avatar className="w-12 h-12 border shrink-0 mt-1">
                    <AvatarImage src={data.driver.image || undefined} />
                    <AvatarFallback className="text-lg bg-muted">{data.driver.name?.charAt(0) || "U"}</AvatarFallback>
                 </Avatar>
                 <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Driver</span>
                    <span className="font-bold text-lg">{data.driver.name}</span>
                    {data.driver.verified && <span className="text-xs flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3"/> ID Verified</span>}
                 </div>
              </div>
              <div className="p-6 flex items-start gap-4">
                 <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Vehicle</span>
                    <span className="font-bold text-lg">{data.car.name}</span>
                    <span className="font-mono text-sm bg-muted px-2 py-0.5 rounded w-fit">{data.car.plateNumber}</span>
                 </div>
              </div>
           </div>
           
           <div className="p-6 flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4 border rounded-lg p-4 bg-muted/10 items-center">
                 <div className="flex flex-col items-center justify-center text-center gap-1 border-r">
                    <Users className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-2xl font-bold">{data.journey.seatsAvailable}</span>
                    <span className="text-xs text-muted-foreground font-medium">Seats Left</span>
                 </div>
                 <div className="flex flex-col items-center justify-center text-center gap-1">
                    <Briefcase className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-2xl font-bold">{data.journey.luggageCapacity} Kg</span>
                    <span className="text-xs text-muted-foreground font-medium">Luggage Space</span>
                 </div>
              </div>

              {alreadyBooked ? (
                 <div className="bg-primary/10 border border-primary/20 text-primary p-4 rounded-lg flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 shrink-0" />
                    <div>
                       <h4 className="font-bold">You are booked on this journey</h4>
                       <p className="text-sm opacity-90">View your booking code and details in the My Bookings tab.</p>
                    </div>
                 </div>
              ) : (
                <form action={bookJourneyAction} className="space-y-4">
                  <input type="hidden" name="journeyId" value={data.journey.id} />
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="seatsBooked">Seats to Book</Label>
                       <Input id="seatsBooked" name="seatsBooked" type="number" min={1} max={data.journey.seatsAvailable} defaultValue={1} required />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="luggageSpace">Luggage Required (Kg)</Label>
                       <Input id="luggageSpace" name="luggageSpace" type="number" min={0} max={data.journey.luggageCapacity} defaultValue={0} required />
                     </div>
                  </div>
                  <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-lg flex items-start gap-3">
                     <Info className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                     <div className="text-sm text-secondary-foreground">
                        Booking requires full payment via M-Pesa. A unique booking code will be generated to securely complete the ride.
                     </div>
                  </div>
                  
                  {data.journey.seatsAvailable > 0 ? (
                    <Button type="submit" size="lg" className="w-full text-lg">Proceed to Booking</Button>
                  ) : (
                    <Button disabled size="lg" className="w-full text-lg">Journey Full</Button>
                  )}
                </form>
              )}
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
