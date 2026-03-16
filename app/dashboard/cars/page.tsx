import { db } from "@/db";
import { cars } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Plus, CarFront, Users, Briefcase } from "lucide-react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/roles";

export default async function CarsPage() {
  const { userId } = await requireRole("driver");

  const userCars = await db.select().from(cars).where(eq(cars.driverId, userId));

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Vehicles</h1>
          <p className="text-muted-foreground text-sm">Manage the cars you use for driving passengers.</p>
        </div>
        <Button asChild className="shrink-0 gap-2">
           <Link href="/dashboard/cars/new">
             <Plus className="w-4 h-4" />
             <span className="hidden md:inline">Add Vehicle</span>
           </Link>
        </Button>
      </div>

      {userCars.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-10 text-center border-dashed bg-muted/30">
           <CarFront className="w-10 h-10 text-muted-foreground mb-4" />
           <CardTitle className="mb-2">No vehicles added</CardTitle>
           <CardDescription className="mb-6">Add your car to start posting journeys and earning.</CardDescription>
           <Button asChild variant="secondary">
             <Link href="/dashboard/cars/new">Add Your First Car</Link>
           </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {userCars.map((car) => (
            <Card key={car.id} className="overflow-hidden flex flex-col group">
              <div className="relative h-32 bg-muted flex items-center justify-center overflow-hidden">
                {car.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={car.photo} alt={car.name} className="object-cover w-full h-full" />
                ) : (
                  <CarFront className="w-12 h-12 text-muted-foreground/30" />
                )}
                <div className="absolute top-2 right-2">
                  {car.verified ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-600 dark:bg-orange-900/30">
                      <AlertCircle className="w-3 h-3 mr-1" /> Pending
                    </Badge>
                  )}
                </div>
              </div>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg">{car.name}</CardTitle>
                <CardDescription className="font-mono">{car.plateNumber}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 mt-auto">
                 <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground bg-muted/30 p-2 rounded-md">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {car.seats} Seats
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {car.luggageCapacity} Kg
                    </div>
                 </div>
                 <Button asChild variant="outline" className="mt-4 w-full rounded-xl">
                   <Link href={`/dashboard/cars/${car.id}`}>Manage Vehicle</Link>
                 </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
