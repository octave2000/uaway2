"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Car,
  Users,
  Clock,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

interface MyJourney {
  id: string;
  origin: string;
  destination: string;
  departureTime: Date;
  pricePerSeat: number;
  seatsAvailable: number;
  status: string;
}

interface DriverDashboardProps {
  userName: string;
  activeJourneys: MyJourney[];
  pendingBookingsCount: number;
}

export function DriverDashboard({
  userName,
  activeJourneys,
  pendingBookingsCount
}: DriverDashboardProps) {
  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            Host Dashboard
          </h1>
          <p className="text-muted-foreground font-medium">
            Welcome back, {userName.split(' ')[0]}. Ready to hit the road?
          </p>
        </div>

        <Button size="lg" className=" h-16 px-8 rounded-2xl shadow-xl shadow-secondary/20 gap-3 group" asChild>
          <Link href="/dashboard/journeys/new">
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
            Create Journey
          </Link>
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">

          {/* Notifications / Alerts */}
          {pendingBookingsCount > 0 && (
            <Card className="bg-orange-500/10 border-orange-500/20 shadow-xl relative overflow-hidden group rounded-[2rem] border-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center shrink-0">
                  <Users className="w-8 h-8 text-orange-600" />
                </div>
                <div className="flex flex-col gap-1 text-center md:text-left">
                  <h3 className="text-2xl font-black text-orange-950 leading-tight">
                    {pendingBookingsCount} New Booking Requests
                  </h3>
                  <p className="text-sm font-bold text-orange-900/60">
                    Passengers are waiting for your confirmation to join your rides.
                  </p>
                </div>
                <Button variant="outline" className="ml-auto w-full md:w-auto border-orange-500/30 text-orange-600 font-black uppercase tracking-widest text-xs h-14 px-8 rounded-xl hover:bg-orange-500/10" asChild>
                  <Link href="/dashboard/journeys">Manage Requests</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Hosted Journeys Feed */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-2xl font-black tracking-tight">Your Hosted Journeys</h2>
            </div>

            <div className="grid gap-4">
              {activeJourneys.length === 0 ? (
                <div className="text-center p-16 border-2 border-dashed rounded-[2rem] bg-muted/10 text-muted-foreground w-full">
                  <Car className="w-16 h-16 mx-auto mb-4 opacity-10" />
                  <p className="font-bold text-lg">You aren&apos;t hosting any rides.</p>
                  <p className="text-sm opacity-60">Create a journey to start sharing your car and earning.</p>
                </div>
              ) : (
                activeJourneys.map((data) => (
                  <Link key={data.id} href={`/dashboard/journeys/${data.id}/manage`}>
                    <Card className="p-6 flex flex-col gap-5 shadow-sm hover:shadow-2xl transition-all hover:translate-y-[-4px] border-border/50 bg-background/40 backdrop-blur-xl group relative rounded-3xl overflow-hidden">
                      <div className="absolute right-0 top-0 w-1.5 bg-secondary/20 h-full group-hover:bg-secondary transition-colors" />
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3 text-foreground font-black text-xl md:text-2xl">
                            <span>{data.origin}</span>
                            <div className="w-6 h-1 bg-secondary/30 rounded-full" />
                            <span>{data.destination}</span>
                          </div>
                          <div className="flex items-center gap-2.5 text-muted-foreground text-[10px] md:text-xs font-black uppercase tracking-widest">
                            <Clock className="w-4 h-4 text-secondary/70" />
                            <span className="text-secondary font-black">{data.status}</span>
                            <span>•</span>
                            <span>{format(new Date(data.departureTime), "MMM d, h:mm a")}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-2xl md:text-4xl font-black text-secondary">{data.pricePerSeat}</span>
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">KES / SEAT</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 text-xs font-black text-muted-foreground border-t pt-5 border-border/30">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-secondary/50" />
                          <span>{data.seatsAvailable} Seats Left</span>
                        </div>
                        <div className="ml-auto">
                          <Button size="sm" variant="ghost" className="font-black text-[10px] uppercase tracking-widest h-auto py-3 group-hover:text-secondary px-4 bg-muted/30 rounded-full border border-border/20">
                            Manage Ride <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-8">
          {/* Hosting Guide */}
          <Card className="bg-secondary dark:bg-black/20 text-secondary-foreground border-none shadow-2xl relative overflow-hidden group rounded-[2.5rem] p-2">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/30 transition-all duration-1000" />
            <CardHeader className="p-8">
              <CardTitle className="text-secondary-foreground text-3xl font-black">Trust Center</CardTitle>
              <CardDescription className="text-secondary-foreground/80 font-bold">Build your driver reputation.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0">
              <p className="text-base font-bold text-secondary-foreground/90 leading-relaxed mb-8">
                Verified vehicles and complete profiles get 40% more booking requests on average.
              </p>
              <Button className="w-full  h-16 rounded-2xl shadow-lg border-none text-lg" asChild>
                <Link href="/dashboard/cars">Add Vehicle</Link>
              </Button>
            </CardContent>
          </Card>

          {/* All Clear Placeholder */}
          {pendingBookingsCount === 0 && (
            <Card className="border-dashed border-2 border-border/60 bg-muted/5 flex flex-col items-center justify-center p-12 text-center gap-4 rounded-[2.5rem]">
              <TrendingUp className="w-12 h-12 text-green-500/20" />
              <p className="text-[11px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">All Requests Cleared</p>
              <p className="text-[10px] font-bold text-muted-foreground/40 max-w-[160px]">You are all caught up with passenger bookings.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
