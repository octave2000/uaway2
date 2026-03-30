import { desc, eq } from "drizzle-orm";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { cars, journeys, users } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/auth/roles";

export default async function AdminJourneysPage() {
  await requireSuperAdmin();

  const journeyRows = await db
    .select({
      journey: journeys,
      driver: { name: users.name, email: users.email },
      car: { id: cars.id, name: cars.name, plateNumber: cars.plateNumber, verified: cars.verified },
    })
    .from(journeys)
    .innerJoin(users, eq(journeys.driverId, users.id))
    .innerJoin(cars, eq(journeys.carId, cars.id))
    .orderBy(desc(journeys.departureTime));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <div className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Admin journeys</p>
        <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
          Monitor route supply across the platform.
        </h1>
        <p className="max-w-3xl text-sm font-medium text-muted-foreground md:text-base">
          Review trip status, assigned vehicles, departure timing, and driver ownership in one responsive queue.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {journeyRows.map(({ journey, driver, car }) => (
          <Card key={journey.id} className="rounded-[2rem] border border-border/60 bg-card/90 shadow-sm">
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="text-xl font-black">{journey.origin} to {journey.destination}</CardTitle>
                <CardDescription className="font-medium">
                  Driver: {driver.name || "Unknown"} • {driver.email}
                </CardDescription>
              </div>
              <Badge className="uppercase">{journey.status}</Badge>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Departure</div><div className="mt-2 text-sm font-bold text-foreground">{format(new Date(journey.departureTime), "MMM d, yyyy h:mm a")}</div></div>
              <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Vehicle</div><div className="mt-2 text-sm font-bold text-foreground">{car.name} • {car.plateNumber}</div></div>
              <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Seats left</div><div className="mt-2 text-sm font-bold text-foreground">{journey.seatsAvailable}</div></div>
              <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Price</div><div className="mt-2 text-sm font-bold text-foreground">{journey.pricePerSeat} KES</div></div>
              <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4 sm:col-span-2"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Vehicle status</div><div className="mt-2 text-sm font-bold text-foreground">{car.verified ? "Verified vehicle" : "Vehicle pending verification"}</div></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
