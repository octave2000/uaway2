import { db } from "@/db";
import { bookings, journeys, users, cars, payments, reviews } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Calendar, QrCode, Star } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { submitReviewAction } from "./actions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { requireRole } from "@/lib/auth/roles";

export default async function BookingsPage() {
  const { userId } = await requireRole("passenger");

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

  // Get reviews for these bookings
  const userReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.clientId, userId));

  const reviewedJourneyIds = new Set(userReviews.map((r) => r.journeyId));

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-5xl mx-auto mb-20 md:mb-0">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-black tracking-tight text-foreground">My Bookings</h1>
        <p className="text-muted-foreground text-sm font-medium">View and manage your upcoming and past rides.</p>
      </div>

      {userBookings.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-muted/30 mt-8 rounded-2xl">
           <Calendar className="w-12 h-12 text-muted-foreground/20 mb-4" />
           <CardTitle className="mb-2">No bookings yet</CardTitle>
           <CardDescription>You haven&apos;t booked any journeys. Discover rides on the home page.</CardDescription>
           <Button asChild className="mt-4" variant="secondary"><Link href="/dashboard/journeys">Explore Rides</Link></Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {userBookings.map((data) => {
            const isCompleted = data.journey.status === 'completed';
            const isReviewed = reviewedJourneyIds.has(data.journey.id);

            return (
              <Card key={data.booking.id} className="overflow-hidden flex flex-col shadow-md border-border/50 bg-background/60 backdrop-blur-md rounded-2xl">
                 <div className="flex flex-col md:flex-row">
                    <div className="bg-primary/5 p-8 md:w-1/3 flex flex-col justify-center items-center text-center border-b md:border-b-0 md:border-r gap-3 relative overflow-hidden shrink-0">
                        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-50" />
                        <QrCode className="w-16 h-16 text-primary mb-2" />
                        <div className="space-y-1 z-10">
                          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Booking Code</div>
                          <div className="text-4xl font-black font-mono tracking-widest text-primary">{data.booking.bookingCode}</div>
                          <div className="text-[10px] font-bold text-muted-foreground/60 mt-3 uppercase tracking-wider">Provide code to driver at end</div>
                        </div>
                    </div>
                    <div className="p-8 md:w-2/3 flex flex-col gap-6">
                        <div className="flex justify-between items-start">
                          <div className="font-black text-xl flex items-center gap-3">
                              {data.journey.origin} <div className="w-4 h-0.5 bg-primary/30" /> {data.journey.destination}
                          </div>
                          <Badge variant={isCompleted ? "secondary" : "default"} className="uppercase font-black text-[10px] py-1 px-3 rounded-full">
                            {isCompleted ? "Completed" : data.booking.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                          <Calendar className="w-4 h-4 text-primary" />
                          {format(new Date(data.journey.departureTime), "PPPP 'at' p")}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-border/40 mt-2">
                          <div className="flex flex-col gap-1.5">
                              <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Driver</span>
                              <span className="text-sm font-extrabold">{data.driver.name}</span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                              <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Contact</span>
                              <span className="text-sm font-extrabold">{data.driver.phone || "N/A"}</span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                              <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Vehicle</span>
                              <span className="text-sm font-extrabold truncate" title={`${data.car.name} (${data.car.plateNumber})`}>
                                {data.car.name}
                              </span>
                          </div>
                          <div className="flex flex-col gap-1.5">
                              <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Paid</span>
                              <span className="text-sm font-black text-green-600">{data.payment.amount} <span className="text-[10px]">KES</span></span>
                          </div>
                        </div>

                        {isCompleted && !isReviewed && (
                          <div className="mt-4 p-6 bg-secondary/5 rounded-2xl border border-secondary/20 flex flex-col gap-4">
                             <div className="flex items-center gap-2 text-secondary font-black text-sm uppercase tracking-widest">
                               <Star className="w-4 h-4 fill-secondary" /> Rate your experience
                             </div>
                             <form action={submitReviewAction} className="flex flex-col gap-4">
                               <input type="hidden" name="journeyId" value={data.journey.id} />
                               <input type="hidden" name="driverId" value={data.driver.id} />
                               <div className="flex flex-col gap-2">
                                  <Label className="text-xs font-bold text-muted-foreground">Rating (1-5)</Label>
                                  <div className="flex items-center gap-3">
                                     {[1, 2, 3, 4, 5].map((val) => (
                                        <label key={val} className="cursor-pointer group">
                                           <input type="radio" name="rating" value={val} required className="sr-only peer" />
                                           <Star className="w-8 h-8 text-muted-foreground/30 peer-checked:text-yellow-500 peer-checked:fill-yellow-500 group-hover:scale-110 transition-all" />
                                        </label>
                                     ))}
                                  </div>
                               </div>
                               <div className="flex flex-col gap-2">
                                 <Label className="text-xs font-bold text-muted-foreground">Comments (Optional)</Label>
                                 <Input name="comment" placeholder="Tell us about the driver or vehicle..." className="bg-background/50 border-border/40" />
                               </div>
                               <Button type="submit" variant="secondary" className="w-full font-black uppercase text-xs tracking-widest py-6">Submit Review</Button>
                             </form>
                          </div>
                        )}

                        {isReviewed && (
                          <div className="mt-4 p-4 bg-green-500/5 rounded-xl border border-green-500/20 flex items-center justify-center gap-3 text-green-600">
                             <Badge className="bg-green-500/20 text-green-600 border-green-500/30 hover:bg-green-500/30 font-black">Reviewed</Badge>
                             <span className="text-xs font-bold italic opacity-70">Thank you for your feedback!</span>
                          </div>
                        )}
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
