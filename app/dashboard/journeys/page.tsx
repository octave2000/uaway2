import { db } from "@/db";
import { cars, journeys, users } from "@/db/schema";
import { and, desc, eq, ne } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JourneySearch } from "@/components/dashboard/journey-search";
import {
  Briefcase,
  Calendar,
  CarFront,
  ChevronRight,
  Plus,
  Route,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { requireAuthenticatedUser } from "@/lib/auth/roles";

function getJourneyStatusTone(status: "active" | "ongoing" | "completed" | "cancelled") {
  switch (status) {
    case "active":
      return "bg-primary/10 text-primary border-primary/20";
    case "ongoing":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "completed":
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case "cancelled":
      return "bg-rose-500/10 text-rose-600 border-rose-500/20";
  }
}

export default async function JourneysPage() {
  const { userId, role } = await requireAuthenticatedUser();

  if (!role) {
    redirect("/dashboard");
  }

  if (role === "passenger") {
    const exploreJourneys = await db
      .select({
        journey: journeys,
        driver: {
          name: users.name,
          image: users.image,
          verified: users.verified,
        },
        car: { name: cars.name },
      })
      .from(journeys)
      .innerJoin(users, eq(journeys.driverId, users.id))
      .innerJoin(cars, eq(journeys.carId, cars.id))
      .where(and(eq(journeys.status, "active"), ne(journeys.driverId, userId)))
      .orderBy(desc(journeys.departureTime));

    const totalSeats = exploreJourneys.reduce((sum, item) => sum + item.journey.seatsAvailable, 0);
    const verifiedDrivers = exploreJourneys.filter((item) => item.driver.verified).length;

    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:gap-8 md:px-8 md:py-8">
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">
            Passenger Journey Feed
          </p>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-2">
              <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
                Find calm, verified rides across Kenya.
              </h1>
              <p className="max-w-xl text-sm font-medium text-muted-foreground md:text-base">
                Browse active trips, compare seats and luggage space, and book from a cleaner passenger-only flow.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-[2rem] border border-border/60 bg-card/80 p-3 shadow-sm backdrop-blur-xl">
              <div className="rounded-[1.25rem] bg-background/80 px-4 py-3 text-center">
                <div className="text-2xl font-black text-foreground">{exploreJourneys.length}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Rides
                </div>
              </div>
              <div className="rounded-[1.25rem] bg-background/80 px-4 py-3 text-center">
                <div className="text-2xl font-black text-foreground">{totalSeats}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Seats
                </div>
              </div>
              <div className="rounded-[1.25rem] bg-background/80 px-4 py-3 text-center">
                <div className="text-2xl font-black text-foreground">{verifiedDrivers}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  Verified
                </div>
              </div>
            </div>
          </div>
        </div>

        <JourneySearch />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {exploreJourneys.length === 0 ? (
            <Card className="col-span-full rounded-[2rem] border-dashed border-border/60 bg-muted/10 p-10 text-center">
              <CardTitle className="mb-3 text-2xl font-black">No active journeys right now</CardTitle>
              <CardDescription className="mx-auto max-w-md text-sm font-medium">
                Fresh rides appear here as soon as drivers publish them. Check again in a bit from your passenger dashboard.
              </CardDescription>
            </Card>
          ) : (
            exploreJourneys.map((data) => (
              <Card
                key={data.journey.id}
                className="group flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/60 bg-card/85 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <CardHeader className="space-y-4 border-b border-border/40 bg-background/50 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xl font-black text-foreground">
                        <span>{data.journey.origin}</span>
                        <ChevronRight className="h-4 w-4 text-primary" />
                        <span>{data.journey.destination}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{format(new Date(data.journey.departureTime), "MMM d, h:mm a")}</span>
                      </div>
                    </div>
                    <div className="rounded-[1.25rem] bg-primary/10 px-4 py-3 text-right">
                      <div className="text-2xl font-black text-primary">{data.journey.pricePerSeat}</div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">
                        KES / seat
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 border border-border/50">
                      <AvatarImage src={data.driver.image || undefined} />
                      <AvatarFallback className="bg-muted text-xs font-black">
                        {data.driver.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-black text-foreground">{data.driver.name}</span>
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        {data.driver.verified ? "Verified driver" : "Verification pending"}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-5 p-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4">
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        <Users className="h-4 w-4 text-primary" />
                        Seats left
                      </div>
                      <div className="text-2xl font-black text-foreground">{data.journey.seatsAvailable}</div>
                    </div>
                    <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4">
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                        <Briefcase className="h-4 w-4 text-primary" />
                        Luggage
                      </div>
                      <div className="text-2xl font-black text-foreground">{data.journey.luggageCapacity}kg</div>
                    </div>
                  </div>
                  <div className="rounded-[1.25rem] border border-border/40 bg-muted/20 px-4 py-3 text-sm font-bold text-muted-foreground">
                    Vehicle: <span className="text-foreground">{data.car.name}</span>
                  </div>
                  <Button asChild className="mt-auto h-12 rounded-2xl text-sm font-black uppercase tracking-[0.18em]">
                    <Link href={`/dashboard/journeys/${data.journey.id}`}>View details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  const myJourneys = await db
    .select({
      journey: journeys,
      car: { name: cars.name },
    })
    .from(journeys)
    .innerJoin(cars, eq(journeys.carId, cars.id))
    .where(eq(journeys.driverId, userId))
    .orderBy(desc(journeys.departureTime));

  const activeCount = myJourneys.filter((item) => item.journey.status === "active").length;
  const ongoingCount = myJourneys.filter((item) => item.journey.status === "ongoing").length;
  const completedCount = myJourneys.filter((item) => item.journey.status === "completed").length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:gap-8 md:px-8 md:py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">
            Driver Operations
          </p>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
            Plan routes, fill seats, and manage each trip cleanly.
          </h1>
          <p className="max-w-2xl text-sm font-medium text-muted-foreground md:text-base">
            This driver-only view keeps publishing and trip management in one place without mixing it with passenger booking flows.
          </p>
        </div>
        <Button asChild className="h-14 rounded-2xl px-8 text-sm font-black uppercase tracking-[0.18em] shadow-lg shadow-primary/20">
          <Link href="/dashboard/journeys/new">
            <Plus className="mr-2 h-4 w-4" />
            Post Journey
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <Route className="h-4 w-4 text-primary" />
              Total journeys
            </div>
            <div className="text-4xl font-black text-foreground">{myJourneys.length}</div>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              Active
            </div>
            <div className="text-4xl font-black text-foreground">{activeCount}</div>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <Users className="h-4 w-4 text-primary" />
              Ongoing
            </div>
            <div className="text-4xl font-black text-foreground">{ongoingCount}</div>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <CarFront className="h-4 w-4 text-primary" />
              Completed
            </div>
            <div className="text-4xl font-black text-foreground">{completedCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {myJourneys.length === 0 ? (
          <Card className="col-span-full rounded-[2rem] border-dashed border-border/60 bg-muted/10 p-10 text-center">
            <CardTitle className="mb-3 text-2xl font-black">No journeys posted yet</CardTitle>
            <CardDescription className="mx-auto mb-6 max-w-md text-sm font-medium">
              Add a vehicle and publish your first route to start receiving booking requests from passengers.
            </CardDescription>
            <Button asChild className="mx-auto h-12 rounded-2xl px-8 text-sm font-black uppercase tracking-[0.18em]">
              <Link href="/dashboard/journeys/new">Create first journey</Link>
            </Button>
          </Card>
        ) : (
          myJourneys.map((data) => (
            <Card
              key={data.journey.id}
              className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 shadow-sm"
            >
              <CardHeader className="space-y-4 border-b border-border/40 bg-background/50 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xl font-black text-foreground">
                      <span>{data.journey.origin}</span>
                      <ChevronRight className="h-4 w-4 text-primary" />
                      <span>{data.journey.destination}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{format(new Date(data.journey.departureTime), "MMM d, h:mm a")}</span>
                    </div>
                  </div>
                  <Badge className={getJourneyStatusTone(data.journey.status)}>
                    {data.journey.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-5 p-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4">
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      <Users className="h-4 w-4 text-primary" />
                      Seats left
                    </div>
                    <div className="text-2xl font-black text-foreground">{data.journey.seatsAvailable}</div>
                  </div>
                  <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4">
                    <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Luggage
                    </div>
                    <div className="text-2xl font-black text-foreground">{data.journey.luggageCapacity}kg</div>
                  </div>
                </div>
                <div className="rounded-[1.25rem] border border-border/40 bg-muted/20 px-4 py-3 text-sm font-bold text-muted-foreground">
                  Vehicle: <span className="text-foreground">{data.car.name}</span>
                </div>
                <div className="mt-auto flex items-end justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                      Price per seat
                    </div>
                    <div className="text-3xl font-black text-primary">{data.journey.pricePerSeat} KES</div>
                  </div>
                  <Button asChild className="h-12 rounded-2xl px-6 text-sm font-black uppercase tracking-[0.18em]">
                    <Link href={`/dashboard/journeys/${data.journey.id}/manage`}>Manage</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
