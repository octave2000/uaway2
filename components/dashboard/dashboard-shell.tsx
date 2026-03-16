"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Navigation, 
  Car, 
  TrendingUp, 
  Wallet, 
  Calendar, 
  Users, 
  Briefcase, 
  ChevronRight, 
  Plus,
  Search,
  CheckCircle2,
  Clock
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

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

interface MyJourney {
  id: string;
  origin: string;
  destination: string;
  departureTime: Date;
  pricePerSeat: number;
  seatsAvailable: number;
  status: string;
}

interface DashboardShellProps {
  userName: string;
  defaultRole: "passenger" | "driver";
  stats: {
    ridesTaken: number;
    ridesHosted: number;
    totalSpent: number;
    totalEarned: number;
  };
  passengerData: {
    recentJourneys: JourneyData[];
    upcomingBooking: UpcomingBooking | null;
  };
  driverData: {
    myActiveJourneys: MyJourney[];
    pendingBookingsCount: number;
  };
}

export function DashboardShell({ 
  userName, 
  defaultRole,
  stats, 
  passengerData, 
  driverData 
}: DashboardShellProps) {
  const [role, setRole] = useState<"passenger" | "driver">(defaultRole);

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8 w-full max-w-6xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black tracking-tight text-foreground bg-clip-text">
            Hello, {userName.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            Manage your {role === "passenger" ? "travels" : "hosting"} and activities.
          </p>
        </div>

        <Tabs defaultValue={defaultRole} onValueChange={(v) => setRole(v as "passenger" | "driver")} className="w-full md:w-auto">
          <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/30 backdrop-blur-md rounded-xl border border-border/50">
            <TabsTrigger value="passenger" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
              Passenger
            </TabsTrigger>
            <TabsTrigger value="driver" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-widest">
              Driver
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-4">
            {role === "passenger" ? (
              <>
                <Card className="bg-background/50 backdrop-blur-sm border-border/50 shadow-sm transition-all hover:border-primary/50 group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                  <CardContent className="p-6 flex flex-col gap-1">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Navigation className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-3xl font-black tracking-tight">{stats.ridesTaken}</span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em]">Rides Taken</span>
                  </CardContent>
                </Card>
                <Card className="bg-background/50 backdrop-blur-sm border-border/50 shadow-sm transition-all hover:border-orange-500/50 group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                  <CardContent className="p-6 flex flex-col gap-1">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Wallet className="w-5 h-5 text-orange-500" />
                    </div>
                    <span className="text-3xl font-black tracking-tight">{stats.totalSpent.toLocaleString()} <span className="text-xs">KES</span></span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em]">Total Spent</span>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="bg-background/50 backdrop-blur-sm border-border/50 shadow-sm transition-all hover:border-secondary/50 group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                  <CardContent className="p-6 flex flex-col gap-1">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Car className="w-5 h-5 text-secondary" />
                    </div>
                    <span className="text-3xl font-black tracking-tight">{stats.ridesHosted}</span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em]">Rides Hosted</span>
                  </CardContent>
                </Card>
                <Card className="bg-background/50 backdrop-blur-sm border-border/50 shadow-sm transition-all hover:border-green-500/50 group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                  <CardContent className="p-6 flex flex-col gap-1">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <span className="text-3xl font-black tracking-tight">{stats.totalEarned.toLocaleString()} <span className="text-xs">KES</span></span>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em]">Total Earned</span>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <Tabs value={role} className="w-full">
            <TabsContent value="passenger" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Passenger Quick Actions */}
              <Card className="bg-primary shadow-2xl border-none relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/20 transition-all" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-16 -mb-16 blur-2xl" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-2xl font-black">Find your next ride</CardTitle>
                  <CardDescription className="text-white/70 font-medium">Thousands of drivers are traveling your way. Save money and travel safely.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Button className="w-full bg-white text-primary hover:bg-white/90 font-black h-14 rounded-2xl text-lg shadow-xl" asChild>
                    <Link href="/dashboard/journeys" className="flex items-center gap-2">
                      <Search className="w-5 h-5" /> Search Journeys
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Passenger Feed */}
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xl font-bold tracking-tight">Discover Recent Rides</h2>
                  <Button variant="ghost" className="text-sm font-semibold h-auto p-0 hover:bg-transparent hover:text-primary transition-colors" asChild>
                    <Link href="/dashboard/journeys" className="flex items-center gap-1">View All <ChevronRight className="w-4 h-4" /></Link>
                  </Button>
                </div>
                
                <div className="grid gap-4">
                  {passengerData.recentJourneys.length === 0 ? (
                    <div className="text-center p-16 border-2 border-dashed rounded-3xl bg-muted/10 text-muted-foreground w-full">
                      <Navigation className="w-16 h-16 mx-auto mb-4 opacity-10" />
                      <p className="font-bold text-lg">No journeys nearby right now.</p>
                      <p className="text-sm opacity-60">Try searching in a different area or check back later.</p>
                    </div>
                  ) : (
                    passengerData.recentJourneys.map((data) => (
                      <Link key={data.journey.id} href={`/dashboard/journeys/${data.journey.id}`}>
                        <Card className="p-6 flex flex-col gap-5 shadow-sm hover:shadow-2xl transition-all hover:translate-y-[-4px] border-border/50 bg-background/40 backdrop-blur-xl group relative rounded-2xl overflow-hidden">
                          <div className="absolute right-0 top-0 w-1.5 bg-primary/20 h-full group-hover:bg-primary transition-colors" />
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-3 text-foreground font-black text-xl">
                                <span>{data.journey.origin}</span>
                                <div className="w-6 h-1 bg-primary/30 rounded-full" />
                                <span>{data.journey.destination}</span>
                              </div>
                              <div className="flex items-center gap-2.5 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                                <Calendar className="w-4 h-4 text-primary/70" />
                                <span>{format(new Date(data.journey.departureTime), "MMM d, h:mm a")}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-3xl font-black text-primary">{data.journey.pricePerSeat}</span>
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
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="driver" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Driver Quick Actions */}
              <Card className="bg-secondary shadow-2xl border-none relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/20 transition-all" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-16 -mb-16 blur-2xl" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-white text-2xl font-black">Plan a new journey</CardTitle>
                  <CardDescription className="text-white/70 font-medium">Post your route, set your price, and start earning by sharing empty seats.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Button variant="secondary" className="w-full bg-white text-secondary hover:bg-white/90 font-black h-14 rounded-2xl text-lg shadow-xl border-none" asChild>
                    <Link href="/dashboard/journeys/new" className="flex items-center gap-2">
                      <Plus className="w-5 h-5" /> Create New Journey
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Driver Feed: My Active Journeys */}
              <div className="flex flex-col gap-5">
                 <div className="flex items-center justify-between px-1">
                   <h2 className="text-xl font-bold tracking-tight">Your Hosted Journeys</h2>
                 </div>
                 
                 <div className="grid gap-4">
                   {driverData.myActiveJourneys.length === 0 ? (
                     <div className="text-center p-16 border-2 border-dashed rounded-3xl bg-muted/10 text-muted-foreground w-full">
                       <Car className="w-16 h-16 mx-auto mb-4 opacity-10" />
                       <p className="font-bold text-lg">You aren&apos;t hosting any rides.</p>
                       <p className="text-sm opacity-60">Create a journey to start sharing your car and earning.</p>
                     </div>
                   ) : (
                     driverData.myActiveJourneys.map((data) => (
                       <Link key={data.id} href={`/dashboard/journeys/${data.id}/manage`}>
                         <Card className="p-6 flex flex-col gap-5 shadow-sm hover:shadow-2xl transition-all hover:translate-y-[-4px] border-border/50 bg-background/40 backdrop-blur-xl group relative rounded-2xl overflow-hidden">
                           <div className="absolute right-0 top-0 w-1.5 bg-secondary/20 h-full group-hover:bg-secondary transition-colors" />
                           <div className="flex justify-between items-start">
                             <div className="flex flex-col gap-2">
                               <div className="flex items-center gap-3 text-foreground font-black text-xl">
                                 <span>{data.origin}</span>
                                 <div className="w-6 h-1 bg-secondary/30 rounded-full" />
                                 <span>{data.destination}</span>
                               </div>
                               <div className="flex items-center gap-2.5 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                                 <Clock className="w-4 h-4 text-secondary/70" />
                                 <span className="text-secondary font-black">{data.status}</span>
                                 <span>•</span>
                                 <span>{format(new Date(data.departureTime), "MMM d, h:mm a")}</span>
                               </div>
                             </div>
                             <div className="flex flex-col items-end">
                               <span className="text-3xl font-black text-secondary">{data.pricePerSeat}</span>
                               <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">KES / SEAT</span>
                             </div>
                           </div>
                           
                           <div className="flex items-center gap-8 text-xs font-black text-muted-foreground border-t pt-5 border-border/30">
                             <div className="flex items-center gap-2">
                               <Users className="w-4 h-4 text-secondary/50" />
                               <span>{data.seatsAvailable} Seats Available</span>
                             </div>
                             <div className="ml-auto">
                               <Button size="sm" variant="ghost" className="font-black text-[10px] uppercase tracking-widest h-auto py-2 group-hover:text-secondary">
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
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-8">
          {/* Passenger Sidebar content */}
          {role === "passenger" ? (
             <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="flex flex-col gap-3">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/70 px-1">Next Trip</h3>
                 {passengerData.upcomingBooking ? (
                    <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 shadow-xl relative overflow-hidden group rounded-3xl">
                       <div className="absolute bottom-0 left-0 w-full h-1.5 bg-primary/30" />
                       <CardContent className="p-6 flex flex-col gap-5">
                          <div className="flex justify-between items-center">
                             <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm text-primary font-black border-none text-[10px] uppercase tracking-widest px-3 py-1 scale-90">
                                Upcoming
                             </Badge>
                             <span className="text-[9px] font-black opacity-30 uppercase tracking-[0.2em]">Booking</span>
                          </div>
                          <div className="space-y-1.5">
                             <div className="text-xl font-black leading-tight flex items-center gap-2">
                                {passengerData.upcomingBooking.journey.origin} <ChevronRight className="w-4 h-4 text-primary opacity-50" /> {passengerData.upcomingBooking.journey.destination}
                             </div>
                             <div className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-primary/60" />
                                {format(new Date(passengerData.upcomingBooking.journey.departureTime), "MMM d, hh:mm a")}
                             </div>
                          </div>
                          <div className="flex items-center gap-4 bg-white/50 p-4 rounded-2xl border border-white/60 shadow-sm">
                             <Avatar className="w-12 h-12 border-2 border-white shadow-md">
                                <AvatarImage src={passengerData.upcomingBooking.driver.image || undefined} />
                                <AvatarFallback className="font-black">{passengerData.upcomingBooking.driver.name?.charAt(0)}</AvatarFallback>
                             </Avatar>
                             <div className="flex flex-col">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5 opacity-60">Driver</span>
                                <span className="font-black text-sm leading-none">{passengerData.upcomingBooking.driver.name}</span>
                             </div>
                             <Button size="icon" variant="ghost" className="ml-auto rounded-xl hover:bg-white/80 h-10 w-10" asChild>
                                <Link href={`/dashboard/bookings`}>
                                   <ChevronRight className="w-5 h-5 text-primary" />
                                </Link>
                             </Button>
                          </div>
                       </CardContent>
                    </Card>
                 ) : (
                    <Card className="border-dashed border-2 border-border/60 bg-muted/5 flex flex-col items-center justify-center p-12 text-center gap-3 rounded-3xl">
                       <Calendar className="w-10 h-10 text-muted-foreground/10" />
                       <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">No booked trips</p>
                       <Button variant="link" size="sm" className="h-auto p-0 text-primary text-[10px] font-black uppercase tracking-widest hover:no-underline hover:text-primary/70" asChild>
                         <Link href="/dashboard/journeys">Find one now</Link>
                       </Button>
                    </Card>
                 )}
               </div>

               <Card className="bg-black text-white border-none shadow-2xl relative overflow-hidden group rounded-3xl p-2">
                  <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent)]" />
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all" />
                  <CardHeader className="p-6">
                     <CardTitle className="text-white flex items-center gap-2 text-xl font-black">
                        <Badge className="bg-orange-500 hover:bg-orange-600 text-[9px] font-black px-2 py-0 border-none uppercase tracking-[0.1em]">Level 1</Badge>
                        Security
                     </CardTitle>
                     <CardDescription className="text-white/50 font-medium">Verified members enjoy 2x trust.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                     <p className="text-sm font-medium leading-relaxed mb-6 text-white/80">
                        Maximize your safety and visibility by completing your identity verification.
                     </p>
                     <Button className="w-full bg-white text-black hover:bg-gray-100 font-black h-12 rounded-xl shadow-lg border-none" asChild>
                        <Link href="/dashboard/profile">Verify Status</Link>
                     </Button>
                  </CardContent>
               </Card>
             </div>
          ) : (
             <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex flex-col gap-3">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/70 px-1">Attention Required</h3>
                  {driverData.pendingBookingsCount > 0 ? (
                     <Card className="bg-orange-500/10 border-orange-500/20 shadow-xl relative overflow-hidden group rounded-3xl">
                        <CardContent className="p-6 flex flex-col gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                              <Users className="w-6 h-6 text-orange-600" />
                           </div>
                           <div className="space-y-1">
                              <span className="text-2xl font-black text-orange-600">{driverData.pendingBookingsCount}</span>
                              <p className="text-sm font-bold text-orange-900/60 leading-tight">New booking requests require your confirmation.</p>
                           </div>
                           <Button variant="outline" className="w-full border-orange-500/30 text-orange-600 font-black uppercase tracking-widest text-[10px] h-10 rounded-xl hover:bg-orange-500/10" asChild>
                              <Link href="/dashboard/journeys">Manage Requests</Link>
                           </Button>
                        </CardContent>
                     </Card>
                  ) : (
                     <Card className="border-dashed border-2 border-border/60 bg-muted/5 flex flex-col items-center justify-center p-12 text-center gap-3 rounded-3xl">
                        <CheckCircle2 className="w-10 h-10 text-green-500/20" />
                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">All clear</p>
                        <p className="text-[9px] font-bold text-muted-foreground/40 max-w-[140px]">No pending requests from passengers at the moment.</p>
                     </Card>
                  )}
                </div>

                <Card className="bg-secondary shadow-2xl border-none relative overflow-hidden group rounded-3xl">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-16 -mt-16 blur-3xl" />
                   <CardHeader className="p-6">
                      <CardTitle className="text-white text-xl font-black">Trust Center</CardTitle>
                      <CardDescription className="text-white/80 font-medium">Build your driver reputation.</CardDescription>
                   </CardHeader>
                   <CardContent className="p-6 pt-0">
                      <p className="text-sm font-bold text-white/90 leading-relaxed mb-6">
                         Verified vehicles and profiles get 40% more booking requests on average.
                      </p>
                      <Button className="w-full bg-white text-secondary hover:bg-white/90 font-black h-12 rounded-xl shadow-lg border-none" asChild>
                         <Link href="/dashboard/cars">Add Vehicle</Link>
                      </Button>
                   </CardContent>
                </Card>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
