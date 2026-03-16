"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Navigation, 
  Calendar, 
  Users, 
  Briefcase, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { JourneySearch } from "./journey-search";

interface JourneyData {
  journey: {
    id: string;
    origin: string;
    destination: string;
    departureTime: Date;
    pricePerSeat: number;
    seatsAvailable: number;
  };
  driver: {
    name: string | null;
    image: string | null;
  };
  car: {
    name: string;
  };
}

interface UpcomingBooking {
  booking: {
    id: string;
  };
  journey: {
    id: string;
    origin: string;
    destination: string;
    departureTime: Date;
  };
  driver: {
    name: string | null;
    image: string | null;
  };
}

interface PassengerDashboardProps {
  userName: string;
  recentJourneys: JourneyData[];
  upcomingBooking: UpcomingBooking | null;
}

export function PassengerDashboard({ 
  userName, 
  recentJourneys, 
  upcomingBooking 
}: PassengerDashboardProps) {
  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
          Hello, {userName.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground font-medium">
          Ready for your next adventure?
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Advanced Search */}
          <JourneySearch />

          {/* Recent Rides Feed */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-2xl font-black tracking-tight">Recent Live Rides</h2>
              <Button variant="ghost" className="text-sm font-bold h-auto p-0 hover:bg-transparent hover:text-primary transition-colors" asChild>
                <Link href="/dashboard/journeys" className="flex items-center gap-1">View All <ChevronRight className="w-4 h-4" /></Link>
              </Button>
            </div>
            
            <div className="grid gap-4">
              {recentJourneys.length === 0 ? (
                <div className="text-center p-16 border-2 border-dashed rounded-[2rem] bg-muted/10 text-muted-foreground w-full">
                  <Navigation className="w-16 h-16 mx-auto mb-4 opacity-10" />
                  <p className="font-bold text-lg">No journeys nearby right now.</p>
                  <p className="text-sm opacity-60">Try searching or checking back later.</p>
                </div>
              ) : (
                recentJourneys.map((data) => (
                  <Link key={data.journey.id} href={`/dashboard/journeys/${data.journey.id}`}>
                    <Card className="p-6 flex flex-col gap-5 shadow-sm hover:shadow-2xl transition-all hover:translate-y-[-4px] border-border/50 bg-background/40 backdrop-blur-xl group relative rounded-3xl overflow-hidden">
                      <div className="absolute right-0 top-0 w-1.5 bg-primary/20 h-full group-hover:bg-primary transition-colors" />
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3 text-foreground font-black text-xl md:text-2xl">
                            <span>{data.journey.origin}</span>
                            <div className="w-6 h-1 bg-primary/30 rounded-full" />
                            <span>{data.journey.destination}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-muted-foreground text-[10px] md:text-xs font-black uppercase tracking-widest">
                            <Calendar className="w-4 h-4 text-primary/70" />
                            <span>{format(new Date(data.journey.departureTime), "MMM d, h:mm a")}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-2xl md:text-4xl font-black text-primary">{data.journey.pricePerSeat}</span>
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">KES / SEAT</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8 text-xs font-black text-muted-foreground border-t pt-5 border-border/30">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary/50" />
                          <span>{data.journey.seatsAvailable} Empty</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-primary/50" />
                          <span className="truncate max-w-[120px]">{data.car.name}</span>
                        </div>
                        <div className="ml-auto flex items-center gap-3 bg-muted/40 pl-4 pr-1 py-1 rounded-full border border-border/20">
                           <span className="text-[11px] font-black">{data.driver.name?.split(' ')[0]}</span>
                           <Avatar className="w-6 h-6 border shadow-sm">
                             <AvatarImage src={data.driver.image || undefined} />
                             <AvatarFallback className="text-[8px]">{data.driver.name?.charAt(0)}</AvatarFallback>
                           </Avatar>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ) )
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-8">
          {/* Upcoming Trip Card */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/70 px-1">Upcoming Ride</h3>
            {upcomingBooking ? (
              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 shadow-xl relative overflow-hidden group rounded-[2rem]">
                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-primary/30" />
                <CardContent className="p-6 flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <Badge className="bg-white/80 backdrop-blur-sm text-primary font-black border-none text-[10px] uppercase tracking-widest px-3 py-1">
                      Confirmed
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xl font-black leading-tight flex items-center gap-2">
                      {upcomingBooking.journey.origin} <ChevronRight className="w-4 h-4 text-primary opacity-50" /> {upcomingBooking.journey.destination}
                    </div>
                    <div className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-primary/60" />
                      {format(new Date(upcomingBooking.journey.departureTime), "MMM d, hh:mm a")}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-white/50 p-4 rounded-2xl border border-white/60 shadow-sm">
                    <Avatar className="w-12 h-12 border-2 border-white shadow-md">
                      <AvatarImage src={upcomingBooking.driver.image || undefined} />
                      <AvatarFallback className="font-black">{upcomingBooking.driver.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5 opacity-60">Driver</span>
                      <span className="font-black text-sm leading-none">{upcomingBooking.driver.name}</span>
                    </div>
                    <Button size="icon" variant="ghost" className="ml-auto rounded-xl hover:bg-white/80 h-10 w-10 text-primary" asChild>
                      <Link href={`/dashboard/bookings`}>
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-2 border-border/60 bg-muted/5 flex flex-col items-center justify-center p-12 text-center gap-4 rounded-[2.5rem]">
                <Calendar className="w-12 h-12 text-muted-foreground/10" />
                <p className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">No trips planned</p>
                <Button variant="link" size="sm" className="h-auto p-0 text-primary text-[10px] font-black uppercase tracking-widest hover:no-underline" asChild>
                  <Link href="/dashboard/journeys">Book a ride</Link>
                </Button>
              </Card>
            )}
          </div>

          {/* Security Banner */}
          <Card className="bg-foreground text-background border-none shadow-2xl relative overflow-hidden group rounded-[2.5rem] p-2">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent)]" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all" />
            <CardHeader className="p-6">
              <CardTitle className="text-background flex items-center gap-2 text-2xl font-black">
                <ShieldCheck className="w-8 h-8 text-primary" />
                Trust
              </CardTitle>
              <CardDescription className="text-background/50 font-bold">Verified members enjoy 2x trust.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <p className="text-sm font-medium leading-relaxed mb-6 text-background/80">
                Maximize your safety and visibility by completing your identity verification today.
              </p>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-black h-14 rounded-2xl shadow-lg border-none text-lg" asChild>
                <Link href="/dashboard/profile">Get Verified</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
