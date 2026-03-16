import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { addCarAction } from "./actions";
import { requireRole } from "@/lib/auth/roles";

export default async function NewCarPage() {
  await requireRole("driver");

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/cars">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Add a New Vehicle</h1>
          <p className="text-muted-foreground text-sm">Enter your car details to use it for journeys.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
          <CardDescription>All fields are required to register your vehicle.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={addCarAction} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Car Name / Model</Label>
                <Input id="name" name="name" placeholder="e.g. Toyota Prius 2018" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plateNumber">Plate Number</Label>
                <Input id="plateNumber" name="plateNumber" placeholder="e.g. KCD 123A" required className="uppercase" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="seats">Passenger Seats</Label>
                   <Input id="seats" name="seats" type="number" min={1} max={10} placeholder="3" required />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="luggageCapacity">Luggage Capacity (Kg)</Label>
                   <Input id="luggageCapacity" name="luggageCapacity" type="number" min={0} placeholder="50" required />
                 </div>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t">
              <Label>Vehicle Photo (Optional)</Label>
              <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
                 <span className="text-sm font-medium text-muted-foreground">Click to upload photo</span>
                 <input type="file" name="photo" className="hidden" accept="image/*" />
              </label>
            </div>
            <Button type="submit" className="w-full">Register Vehicle</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
