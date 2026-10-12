import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { cars, journeys, bookings } from "@/db/schema";
import { DomainError } from "./policy";
import { ownedFile } from "./files";
import { audit } from "./shared";
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  plateNumber: z
    .string()
    .trim()
    .min(4)
    .max(15)
    .transform((v) => v.toUpperCase().replace(/\s+/g, "")),
  seats: z.coerce.number().int().min(1).max(8),
  luggageCapacity: z.coerce.number().int().min(0).max(200),
  photoUrl: z.string().default(""),
  insuranceProvider: z.string().trim().max(100).default(""),
  insuranceExpiry: z.string().max(10).default(""),
  insuranceDocumentUrl: z.string().max(2000).default(""),
});
export async function saveVehicle(userId: string, input: unknown, id?: string) {
  const data = schema.parse(input);
  const photo = data.photoUrl
    ? await ownedFile(userId, data.photoUrl, "carPhoto")
    : null;
  const insuranceDocument = data.insuranceDocumentUrl
    ? await ownedFile(userId, data.insuranceDocumentUrl, "insuranceDocument")
    : null;
  const insuranceExpiry = data.insuranceExpiry
    ? new Date(`${data.insuranceExpiry}T23:59:59.000Z`)
    : null;
  if (insuranceExpiry && Number.isNaN(insuranceExpiry.getTime()))
    throw new DomainError("insurance", "Enter a valid insurance expiry date.");
  await db.transaction(async (tx) => {
    if (id) {
      await tx
        .select()
        .from(journeys)
        .where(
          and(
            eq(journeys.carId, id),
            inArray(journeys.status, ["active", "ongoing"]),
          ),
        )
        .orderBy(journeys.id)
        .for("update");
      const [car] = await tx
        .select()
        .from(cars)
        .where(and(eq(cars.id, id), eq(cars.driverId, userId)))
        .for("update");
      if (!car) throw new DomainError("missing", "Vehicle not found.");
      const active = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
        .where(
          and(
            eq(journeys.carId, id),
            inArray(journeys.status, ["active", "ongoing"]),
            inArray(bookings.status, ["confirmed", "payment_pending"]),
          ),
        );
      if (active.length)
        throw new DomainError(
          "booked",
          "This vehicle has active bookings. Cancel the affected journeys before changing it.",
        );
      await tx
        .update(cars)
        .set({
          name: data.name,
          plateNumber: data.plateNumber,
          seats: data.seats,
          luggageCapacity: data.luggageCapacity,
          photo,
          insuranceProvider: data.insuranceProvider || null,
          insuranceExpiry,
          ...(insuranceDocument
            ? { insuranceDocument, insuranceVerifiedAt: null }
            : {}),
          verified: false,
        })
        .where(eq(cars.id, id));
      await audit(tx, userId, "vehicle.updated", id);
    } else {
      const [car] = await tx
        .insert(cars)
        .values({
          driverId: userId,
          name: data.name,
          plateNumber: data.plateNumber,
          seats: data.seats,
          luggageCapacity: data.luggageCapacity,
          photo,
          insuranceProvider: data.insuranceProvider || null,
          insuranceExpiry,
          insuranceDocument,
        })
        .returning();
      await audit(tx, userId, "vehicle.created", car.id);
    }
  });
}
