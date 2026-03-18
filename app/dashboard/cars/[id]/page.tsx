import { and, eq } from "drizzle-orm";
import { ArrowLeft, Briefcase, CarFront, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CarImage } from "@/components/shared/car-image";
import { FileUploadField } from "@/components/uploadthing/file-upload-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { cars } from "@/db/schema";
import { requireRole } from "@/lib/auth/roles";

import { submitCarVerificationAction, updateCarAction } from "./actions";

export default async function CarDetailsPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { userId } = await requireRole("driver");

  const [car] = await db
    .select()
    .from(cars)
    .where(and(eq(cars.id, id), eq(cars.driverId, userId)))
    .limit(1);

  if (!car) {
    redirect("/dashboard/cars");
  }

  const verificationLabel = car.verified
    ? "Verified"
    : car.documentPhoto
      ? "Under review"
      : "Pending verification";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 md:gap-8 md:px-8 md:py-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/cars">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">
            Vehicle Management
          </p>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
            {car.name}
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Update your vehicle details and keep its verification status current.
          </p>
        </div>
        <Badge
          className={`ml-auto ${
            car.verified
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
              : "border-amber-500/20 bg-amber-500/10 text-amber-600"
          }`}
        >
          {verificationLabel}
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-black">Vehicle details</CardTitle>
            <CardDescription className="font-medium">
              Keep these details accurate so passengers see the correct vehicle information on your journeys.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateCarAction} className="space-y-6">
              <input type="hidden" name="carId" value={car.id} />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="name">Vehicle name / model</Label>
                  <Input id="name" name="name" defaultValue={car.name} className="h-12 rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plateNumber">Plate number</Label>
                  <Input
                    id="plateNumber"
                    name="plateNumber"
                    defaultValue={car.plateNumber}
                    className="h-12 rounded-2xl uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seats">Passenger seats</Label>
                  <Input id="seats" name="seats" type="number" min={1} max={10} defaultValue={car.seats} className="h-12 rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="luggageCapacity">Luggage capacity (kg)</Label>
                  <Input
                    id="luggageCapacity"
                    name="luggageCapacity"
                    type="number"
                    min={0}
                    defaultValue={car.luggageCapacity}
                    className="h-12 rounded-2xl"
                  />
                </div>
              </div>
              <FileUploadField
                accept="image/*"
                acceptedLabel="JPG, PNG, or WEBP up to 4MB"
                endpoint="carPhoto"
                helper="Replace the photo used on public and passenger journey cards."
                label="Vehicle photo"
                name="photoUrl"
                value={car.photo}
              />
              <Button type="submit" className="h-12 rounded-2xl px-8 text-sm font-black uppercase tracking-[0.18em]">
                Save changes
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-black">Vehicle snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <CarImage
                src={car.photo}
                alt={car.name}
                className="aspect-[16/9] rounded-[1.5rem] border border-border/40"
                sizes="(max-width: 1280px) 100vw, 33vw"
              />
              <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  Seats
                </div>
                <div className="text-2xl font-black text-foreground">{car.seats}</div>
              </div>
              <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Luggage
                </div>
                <div className="text-2xl font-black text-foreground">{car.luggageCapacity}kg</div>
              </div>
              <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  <CarFront className="h-4 w-4 text-primary" />
                  Plate
                </div>
                <div className="text-lg font-black text-foreground">{car.plateNumber}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl font-black">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Verification
              </CardTitle>
              <CardDescription className="font-medium">
                Upload your car document and submit the vehicle for trust review. Submitted documents stay pending until you review them manually.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <form action={submitCarVerificationAction}>
                <input type="hidden" name="carId" value={car.id} />
                <FileUploadField
                  accept="image/*,.pdf"
                  acceptedLabel="JPG, PNG, or PDF up to 8MB"
                  endpoint="carDocument"
                  helper="Upload the registration or ownership document for this vehicle."
                  kind="document"
                  label="Registration document"
                  name="documentPhotoUrl"
                  value={car.documentPhoto}
                />
                <Button type="submit" className="h-12 w-full rounded-2xl text-sm font-black uppercase tracking-[0.18em]">
                  {car.documentPhoto ? "Resubmit for review" : "Submit for verification"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
