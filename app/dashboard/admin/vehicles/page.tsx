import { desc, eq } from "drizzle-orm";

import { setCarVerificationAction } from "@/app/dashboard/admin/actions";
import { CarImage } from "@/components/shared/car-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { db } from "@/db";
import { cars, users } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/auth/roles";

export default async function AdminVehiclesPage() {
  await requireSuperAdmin();

  const vehicleRows = await db
    .select({
      car: cars,
      driver: {
        name: users.name,
        email: users.email,
      },
    })
    .from(cars)
    .innerJoin(users, eq(cars.driverId, users.id))
    .orderBy(cars.verified, desc(cars.createdAt));

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <div className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Admin vehicles</p>
        <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
          Vehicle verification and fleet review.
        </h1>
        <p className="max-w-3xl text-sm font-medium text-muted-foreground md:text-base">
          Inspect the uploaded vehicle image and registration document, then approve or revoke verification.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm"><CardContent className="p-6"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Vehicles</div><div className="mt-3 text-4xl font-black text-foreground">{vehicleRows.length}</div></CardContent></Card>
        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm"><CardContent className="p-6"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Verified</div><div className="mt-3 text-4xl font-black text-foreground">{vehicleRows.filter((row) => row.car.verified).length}</div></CardContent></Card>
        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm"><CardContent className="p-6"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Waiting review</div><div className="mt-3 text-4xl font-black text-foreground">{vehicleRows.filter((row) => !row.car.verified && row.car.documentPhoto).length}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {vehicleRows.map(({ car, driver }) => (
          <Card key={car.id} className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 shadow-sm">
            <CarImage
              src={car.photo}
              alt={car.name}
              className="aspect-[16/8]"
              sizes="(max-width: 1280px) 100vw, 50vw"
            />
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="text-xl font-black">{car.name}</CardTitle>
                <CardDescription className="font-medium">
                  {car.plateNumber} • {driver.name || "Unknown driver"} • {driver.email}
                </CardDescription>
              </div>
              <Badge
                className={
                  car.verified
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                    : car.documentPhoto
                      ? "border-amber-500/20 bg-amber-500/10 text-amber-600"
                      : "border-border/60 bg-muted/20 text-foreground"
                }
              >
                {car.verified ? "verified" : car.documentPhoto ? "awaiting review" : "missing docs"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Seats</div><div className="mt-2 text-sm font-bold text-foreground">{car.seats}</div></div>
                <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Luggage</div><div className="mt-2 text-sm font-bold text-foreground">{car.luggageCapacity} kg</div></div>
                <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Document</div><div className="mt-2 text-sm font-bold text-foreground">{car.documentPhoto ? "Uploaded" : "Missing"}</div></div>
              </div>

              <div className="flex flex-wrap gap-3">
                {car.documentPhoto ? (
                  <Button asChild variant="outline" className="rounded-2xl">
                    <a href={car.documentPhoto} target="_blank" rel="noreferrer">Open registration doc</a>
                  </Button>
                ) : null}
              </div>

              {car.documentPhoto || car.verified ? (
                <form action={setCarVerificationAction} className="flex flex-col gap-3 sm:flex-row">
                  <input type="hidden" name="carId" value={car.id} />
                  <input type="hidden" name="nextState" value={car.verified ? "false" : "true"} />
                  <SubmitButton className="rounded-2xl font-black uppercase tracking-[0.18em]" pendingText="Updating...">
                    {car.verified ? "Revoke vehicle verification" : "Approve vehicle verification"}
                  </SubmitButton>
                </form>
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-border/60 bg-muted/10 p-4 text-sm font-medium text-muted-foreground">
                  No registration document has been uploaded for this vehicle.
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
