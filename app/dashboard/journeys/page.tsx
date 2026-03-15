import { auth } from "@/auth";
import { db } from "@/db";
import { journeys, users, cars } from "@/db/schema";
import { eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users, Briefcase, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

export default async function JourneysPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // All active journeys not posted by current user
  const exploreJourneys = await db
    .select({
      journey: journeys,
      driver: { name: users.name, image: users.image },
      car: { name: cars.name }
    })
    .from(journeys)
    .innerJoin(users, eq(journeys.driverId, users.id))
    .innerJoin(cars, eq(journeys.carId, cars.id))
    .where(ne(journeys.driverId, session.user.id));

  // Journeys posted by current user
  const myJourneys = await db
    .select({
      journey: journeys,
      car: { name: cars.name }
    })
    .from(journeys)
    .innerJoin(cars, eq(journeys.carId, cars.id))
    .where(eq(journeys.driverId, session.user.id));

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Journeys</h1>
          <p className="text-muted-foreground text-sm">Find a ride or manage the journeys you posted.</p>
        </div>
        <Button asChild className="shrink-0 gap-2">
           <Link href="/dashboard/journeys/new">
             <Plus className="w-4 h-4" />
             <span className="hidden md:inline">Post Journey</span>
           </Link>
        </Button>
      </div>

      <Tabs defaultValue="explore" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="explore">Explore Rides</TabsTrigger>
          <TabsTrigger value="posted">My Posts</TabsTrigger>
        </TabsList>
        <TabsContent value="explore" className="mt-6 flex flex-col gap-4">
           {exploreJourneys.length === 0 ? (
             <div className="text-center p-8 border rounded-lg bg-muted/10 text-muted-foreground">
               No journeys available right now. Check back later!
             </div>
           ) : (
             exploreJourneys.map((data) => (
                <Card key={data.journey.id} className="p-4 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-border/50 group">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-foreground font-semibold">
                        <span>{data.journey.origin}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <span>{data.journey.destination}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{format(new Date(data.journey.departureTime), "MMM d, hh:mm a")}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-lg font-bold text-primary">{data.journey.pricePerSeat} KES</span>
                      <span className="text-xs text-muted-foreground">per seat</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground border-t pt-3 border-border/50">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{data.journey.seatsAvailable} left</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[80px] md:max-w-none">{data.car.name}</span>
                    </div>
                    <div className="ml-auto flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                      <span className="text-[10px] md:text-sm">Driver: {data.driver.name?.split(' ')[0]}</span>
                      <div className="w-6 h-6 rounded-full bg-muted border overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={data.driver.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.driver.name}`} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  </div>
                  <Button asChild className="w-full mt-2" variant="outline">
                    <Link href={`/dashboard/journeys/${data.journey.id}`}>View Details & Book</Link>
                  </Button>
                </Card>
             ))
           )}
        </TabsContent>
        <TabsContent value="posted" className="mt-6 flex flex-col gap-4">
           {myJourneys.length === 0 ? (
             <div className="text-center p-8 border rounded-lg bg-muted/10 text-muted-foreground">
               You haven't posted any journeys yet.
             </div>
           ) : (
             myJourneys.map((data) => (
               <Card key={data.journey.id} className="p-4 flex flex-col gap-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-foreground font-semibold">
                        <span>{data.journey.origin}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <span>{data.journey.destination}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{format(new Date(data.journey.departureTime), "MMM d, hh:mm a")}</span>
                      </div>
                    </div>
                    <Badge variant={data.journey.status === 'active' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                      {data.journey.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground border-t pt-3 border-border/50">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{data.journey.seatsAvailable} left</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>{data.journey.luggageCapacity} Kg</span>
                    </div>
                    <div className="ml-auto text-primary font-bold">
                      {data.journey.pricePerSeat} KES
                    </div>
                  </div>
                  <Button asChild className="w-full mt-2" variant="secondary">
                    <Link href={`/dashboard/journeys/${data.journey.id}/manage`}>Manage Journey</Link>
                  </Button>
               </Card>
             ))
           )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
