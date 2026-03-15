import { auth } from "@/auth";
import { db } from "@/db";
import { bookings, journeys, users, cars, payments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, QrCode } from "lucide-react";
import { format } from "date-fns";

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userBookings = await db
    .select({
      booking: bookings,
      journey: journeys,
      driver: { name: users.name, phone: users.phone },
      car: { name: cars.name, plateNumber: cars.plateNumber },
      payment: payments
    })
    .from(bookings)
    .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
    .innerJoin(users, eq(journeys.driverId, users.id))
    .innerJoin(cars, eq(journeys.carId, cars.id))
    .innerJoin(payments, eq(bookings.id, payments.bookingId))
    .where(eq(bookings.clientId, session.user.id))
    .orderBy(desc(bookings.createdAt));

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-5xl mx-auto mb-20 md:mb-0">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Bookings</h1>
        <p className="text-muted-foreground text-sm">View and manage your upcoming and past rides.</p>
      </div>

      {userBookings.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-muted/30 mt-8">
           <Calendar className="w-10 h-10 text-muted-foreground mb-4" />
           <CardTitle className="mb-2">No bookings yet</CardTitle>
           <CardDescription>You haven't booked any journeys.</CardDescription>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {userBookings.map((data) => (
            <Card key={data.booking.id} className="overflow-hidden flex flex-col md:flex-row shadow-sm">
               <div className="bg-primary/5 p-6 md:w-1/3 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r gap-3 relative overflow-hidden">
                  <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
                  <QrCode className="w-12 h-12 text-primary" />
                  <div className="space-y-1 z-10">
                     <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Booking Code</div>
                     <div className="text-3xl font-black font-mono tracking-widest text-primary">{data.booking.bookingCode}</div>
                     <div className="text-xs font-medium text-muted-foreground mt-2">Driver must scan or verify code</div>
                  </div>
               </div>
               <div className="p-6 md:w-2/3 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                     <div className="font-bold text-lg flex items-center gap-2">
                        {data.journey.origin} <MapPin className="w-4 h-4 text-primary" /> {data.journey.destination}
                     </div>
                     <Badge variant={data.booking.status === 'confirmed' ? 'default' : 'secondary'} className="uppercase">
                       {data.booking.status}
                     </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                     <Calendar className="w-4 h-4" />
                     {format(new Date(data.journey.departureTime), "EEEE, MMMM do yyyy - hh:mm a")}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t mt-2">
                     <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Driver</span>
                        <span className="text-sm font-medium">{data.driver.name}</span>
                     </div>
                     <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Contact</span>
                        <span className="text-sm font-medium">{data.driver.phone || "N/A"}</span>
                     </div>
                     <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Vehicle</span>
                        <span className="text-sm font-medium truncate" title={`${data.car.name} (${data.car.plateNumber})`}>
                          {data.car.name}
                        </span>
                     </div>
                     <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground uppercase font-semibold">Payment</span>
                        <span className="text-sm font-bold text-green-600">{data.payment.amount} KES</span>
                     </div>
                  </div>
               </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
