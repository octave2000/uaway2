import { db } from "@/db";
import { cars } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { postJourneyAction } from "./actions";
import { requireRole } from "@/lib/auth/roles";

export default async function NewJourneyPage() {
  const { userId } = await requireRole("driver");

  const userCars = await db.select().from(cars).where(eq(cars.driverId, userId));

  if (userCars.length === 0) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-2xl mx-auto text-center mt-12">
        <h1 className="text-2xl font-bold">No Vehicles Available</h1>
        <p className="text-muted-foreground">You need to add a vehicle before posting a journey.</p>
        <Button asChild className="w-fit mx-auto mt-4">
          <Link href="/dashboard/cars/new">Add a Vehicle</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/journeys">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Post a Journey</h1>
          <p className="text-muted-foreground text-sm">Fill in the journey details to start accepting passengers.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Journey Details</CardTitle>
          <CardDescription>Specify the route, time, and available slots.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={postJourneyAction} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="carId">Select Vehicle</Label>
                <select 
                  id="carId" 
                  name="carId" 
                  required 
                  defaultValue=""
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                >
                  <option value="" disabled>Select a car...</option>
                  {userCars.map(car => (
                    <option key={car.id} value={car.id}>
                      {car.name} ({car.plateNumber}) - {car.seats} Seats
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="origin">Origin</Label>
                   <Input id="origin" name="origin" placeholder="e.g. Nairobi" required />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="destination">Destination</Label>
                   <Input id="destination" name="destination" placeholder="e.g. Nakuru" required />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="departureTime">Departure Time</Label>
                   <Input id="departureTime" name="departureTime" type="datetime-local" required />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="pricePerSeat">Price per Seat (KES)</Label>
                   <Input id="pricePerSeat" name="pricePerSeat" type="number" min={50} placeholder="1500" required />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="seatsAvailable">Seats Available</Label>
                   <Input id="seatsAvailable" name="seatsAvailable" type="number" min={1} placeholder="3" required />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="luggageCapacity">Total Luggage Capacity (Kg)</Label>
                   <Input id="luggageCapacity" name="luggageCapacity" type="number" min={0} placeholder="50" required />
                 </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Journey Note</Label>
                <textarea
                  id="note"
                  name="note"
                  rows={4}
                  maxLength={280}
                  placeholder="Add pickup guidance, timing notes, or anything passengers should know."
                  className="flex min-h-28 w-full rounded-2xl border border-input bg-transparent px-4 py-3 text-sm font-medium shadow-sm outline-none transition-colors placeholder:text-muted-foreground/60 placeholder:font-medium focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs font-medium text-muted-foreground">
                  Optional. Keep it short and useful for passengers.
                </p>
              </div>
            </div>
            <Button type="submit" className="w-full">Post Journey</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
