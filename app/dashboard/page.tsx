import { auth } from "@/auth";
import { db } from "@/db";
import { journeys, users, cars, bookings, payments } from "@/db/schema";
import { eq, desc, and, ne, count, sum } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Calendar, Users, Briefcase, ChevronRight, TrendingUp, Wallet, Car, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default async function DashboardHome() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch stats concurrently
  const [
    ridesTakenCount,
    ridesHostedCount,
    totalSpentSum,
    totalEarnedSum,
    recentJourneys,
    upcomingBookings
  ] = await Promise.all([
    db.select({ count: count() }).from(bookings).where(eq(bookings.clientId, userId)),
    db.select({ count: count() }).from(journeys).where(eq(journeys.driverId, userId)),
    db.select({ total: sum(payments.amount) }).from(payments).innerJoin(bookings, eq(payments.bookingId, bookings.id)).where(eq(bookings.clientId, userId)),
    db.select({ total: sum(payments.amount) }).from(payments).innerJoin(bookings, eq(payments.bookingId, bookings.id)).innerJoin(journeys, eq(bookings.journeyId, journeys.id)).where(eq(journeys.driverId, userId)),
    db.select({
      journey: journeys,
      driver: { name: users.name, image: users.image },
      car: { name: cars.name }
    }).from(journeys)
      .innerJoin(users, eq(journeys.driverId, users.id))
      .innerJoin(cars, eq(journeys.carId, cars.id))
      .where(and(eq(journeys.status, "active"), ne(journeys.driverId, userId)))
      .orderBy(desc(journeys.createdAt))
      .limit(3),
    db.select({
      booking: bookings,
      journey: journeys,
      driver: { name: users.name, image: users.image }
    }).from(bookings)
      .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
      .innerJoin(users, eq(journeys.driverId, users.id))
      .where(and(eq(bookings.clientId, userId), eq(bookings.status, "confirmed")))
      .orderBy(desc(journeys.departureTime))
      .limit(1)
  ]);

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 w-full max-w-6xl mx-auto pb-24">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground bg-clip-text">
          Hello, {session.user.name?.split(' ')[0] || 'Traveler'}!
        </h1>
        <p className="text-muted-foreground text-sm font-medium">Here's what's happening with your UAWAY account today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-background/50 backdrop-blur-sm border-border/50 shadow-sm transition-all hover:border-primary/50 group">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Navigation className="w-4 h-4 text-primary" />
            </div>
            <span className="text-2xl font-bold tracking-tight">{ridesTakenCount[0].count}</span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Rides Taken</span>
          </CardContent>
        </Card>
        <Card className="bg-background/50 backdrop-blur-sm border-border/50 shadow-sm transition-all hover:border-secondary/50 group">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Car className="w-4 h-4 text-secondary" />
            </div>
            <span className="text-2xl font-bold tracking-tight">{ridesHostedCount[0].count}</span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Rides Hosted</span>
          </CardContent>
        </Card>
        <Card className="bg-background/50 backdrop-blur-sm border-border/50 shadow-sm transition-all hover:border-green-500/50 group">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <span className="text-2xl font-bold tracking-tight">{Number(totalEarnedSum[0].total || 0).toLocaleString()} <span className="text-xs">KES</span></span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Total Earned</span>
          </CardContent>
        </Card>
        <Card className="bg-background/50 backdrop-blur-sm border-border/50 shadow-sm transition-all hover:border-orange-500/50 group">
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Wallet className="w-4 h-4 text-orange-500" />
            </div>
            <span className="text-2xl font-bold tracking-tight">{Number(totalSpentSum[0].total || 0).toLocaleString()} <span className="text-xs">KES</span></span>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Total Spent</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-primary shadow-lg border-none relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/20 transition-all" />
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-xl">Find a Ride</CardTitle>
                <CardDescription className="text-white/70">Going somewhere? Join a ride and save costs.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-white text-primary hover:bg-white/90 font-bold" asChild>
                  <Link href="/dashboard/journeys">Search Journeys</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-secondary shadow-lg border-none relative overflow-hidden group cursor-pointer">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/20 transition-all" />
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-xl">Start Driving</CardTitle>
                <CardDescription className="text-white/70">Earn while traveling to your destination.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="secondary" className="w-full bg-white text-secondary hover:bg-white/90 font-bold border-none" asChild>
                  <Link href="/dashboard/journeys/new">Create Journey</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Active Journeys Feed */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-bold tracking-tight">Discover Rides</h2>
              <Button variant="ghost" className="text-sm font-semibold h-auto p-0 hover:bg-transparent hover:text-primary transition-colors" asChild>
                <Link href="/dashboard/journeys" className="flex items-center gap-1">View All <ChevronRight className="w-4 h-4" /></Link>
              </Button>
            </div>
            
            <div className="flex flex-col gap-4">
              {recentJourneys.length === 0 ? (
                <div className="text-center p-12 border-2 border-dashed rounded-2xl bg-muted/20 text-muted-foreground w-full">
                  <Navigation className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-semibold">No journeys nearby right now.</p>
                  <p className="text-xs">Try searching in a different area or check back later.</p>
                </div>
              ) : (
                recentJourneys.map((data) => (
                  <Link key={data.journey.id} href={`/dashboard/journeys/${data.journey.id}`}>
                    <Card className="p-5 flex flex-col gap-5 shadow-sm hover:shadow-xl transition-all hover:translate-y-[-2px] border-border/60 bg-background/60 backdrop-blur-md group relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-1 bg-primary/20 h-full group-hover:bg-primary transition-colors" />
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-3 text-foreground font-extrabold text-lg">
                            <span>{data.journey.origin}</span>
                            <div className="w-4 h-0.5 bg-muted-foreground/30 rounded-full" />
                            <span>{data.journey.destination}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            <span>{format(new Date(data.journey.departureTime), "MMM d, h:mm a")}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-2xl font-black text-primary">{data.journey.pricePerSeat}</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">KES / SEAT</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-xs font-bold text-muted-foreground border-t pt-4 border-border/40">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-primary/60" />
                          <span>{data.journey.seatsAvailable} Left</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-primary/60" />
                          <span className="truncate max-w-[100px]">{data.car.name}</span>
                        </div>
                        <div className="ml-auto flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-full border border-border/30">
                           <span className="text-[11px] font-black">{data.driver.name?.split(' ')[0]}</span>
                           <Avatar className="w-5 h-5 border shadow-sm">
                             <AvatarImage src={data.driver.image || undefined} />
                             <AvatarFallback className="text-[8px]">{data.driver.name?.charAt(0)}</AvatarFallback>
                           </Avatar>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar content */}
        <div className="flex flex-col gap-6">
          {/* Upcoming Trip Card */}
          <div className="flex flex-col gap-3">
             <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/70 px-1">Upcoming Trip</h3>
             {upcomingBookings.length > 0 ? (
               <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 shadow-md relative overflow-hidden group">
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-primary/30" />
                  <CardContent className="p-5 flex flex-col gap-4">
                     <div className="flex justify-between items-center">
                        <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm text-primary font-bold border-none">
                           In {format(new Date(upcomingBookings[0].journey.departureTime), "d 'days'")}
                        </Badge>
                        <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">Client</span>
                     </div>
                     <div className="space-y-1">
                        <div className="text-lg font-black leading-tight flex items-center gap-2">
                           {upcomingBookings[0].journey.origin} <ChevronRight className="w-4 h-4 text-primary" /> {upcomingBookings[0].journey.destination}
                        </div>
                        <div className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                           <Calendar className="w-3 h-3" />
                           {format(new Date(upcomingBookings[0].journey.departureTime), "MMM d, hh:mm a")}
                        </div>
                     </div>
                     <div className="flex items-center gap-3 bg-white/40 p-3 rounded-xl border border-white/60">
                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                           <AvatarImage src={upcomingBookings[0].driver.image || undefined} />
                           <AvatarFallback>{upcomingBookings[0].driver.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Driver</span>
                           <span className="font-bold text-sm leading-none">{upcomingBookings[0].driver.name}</span>
                        </div>
                        <Button size="icon" variant="ghost" className="ml-auto rounded-full hover:bg-white/50" asChild>
                           <Link href={`/dashboard/bookings`}>
                              <ChevronRight className="w-5 h-5" />
                           </Link>
                        </Button>
                     </div>
                  </CardContent>
               </Card>
             ) : (
               <Card className="border-dashed bg-muted/5 flex flex-col items-center justify-center p-8 text-center gap-2">
                  <Calendar className="w-8 h-8 text-muted-foreground/20" />
                  <p className="text-xs font-bold text-muted-foreground">No upcoming trips booked.</p>
                  <Button variant="link" size="sm" className="h-auto p-0 text-primary text-[10px] font-black uppercase tracking-widest" asChild>
                    <Link href="/dashboard/journeys">Explore Now</Link>
                  </Button>
               </Card>
             )}
          </div>

          <Card className="bg-black text-white border-none shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent)]" />
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all" />
             <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                   <Badge className="bg-orange-500 hover:bg-orange-600 text-[10px] font-black px-2 py-0 border-none uppercase">Safe</Badge>
                   Verification
                </CardTitle>
                <CardDescription className="text-white/50">Travel with verified members only.</CardDescription>
             </CardHeader>
             <CardContent>
                <p className="text-sm font-medium leading-relaxed mb-4 text-white/80">
                   Get your ID and vehicle verified today to unlock higher priority and earn trust from the community.
                </p>
                <Button className="w-full bg-white text-black hover:bg-gray-100 font-black shadow-lg" asChild>
                   <Link href="/dashboard/profile">Verify Now</Link>
                </Button>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
