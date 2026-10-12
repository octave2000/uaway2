import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, gt, isNull } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  bookings,
  emergencyAlerts,
  journeys,
  supportCases,
  tripLocations,
  tripShares,
  trustedContacts,
  users,
  cars,
} from "@/db/schema";
import { DomainError } from "@/lib/domain/policy";
import { audit, limit } from "@/lib/domain/shared";

const phoneSchema = z.string().trim().regex(/^\+?[0-9]{9,15}$/);
export async function saveTrustedContact(
  userId: string,
  input: { name: unknown; phone: unknown },
) {
  const data = z.object({ name: z.string().trim().min(2).max(100), phone: phoneSchema }).parse(input);
  await db.insert(trustedContacts).values({ userId, ...data }).onConflictDoUpdate({
    target: [trustedContacts.userId, trustedContacts.phone],
    set: { name: data.name },
  });
}

export async function deleteTrustedContact(userId: string, id: string) {
  await db.delete(trustedContacts).where(and(eq(trustedContacts.userId, userId), eq(trustedContacts.id, id)));
}

export async function createTripShare(userId: string, bookingId: string) {
  const [row] = await db.select({ booking: bookings, journey: journeys })
    .from(bookings).innerJoin(journeys, eq(bookings.journeyId, journeys.id))
    .where(and(eq(bookings.id, bookingId), eq(bookings.clientId, userId)));
  if (!row || row.booking.status !== "confirmed" || !["active", "ongoing"].includes(row.journey.status))
    throw new DomainError("trip_share", "You can share a confirmed, active trip only.");
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const now = new Date();
  const expiry = new Date(Math.min(
    now.getTime() + 12 * 60 * 60 * 1000,
    Math.max(now.getTime() + 60 * 60 * 1000, row.journey.departureTime.getTime() + 6 * 60 * 60 * 1000),
  ));
  await db.insert(tripShares).values({ bookingId, ownerId: userId, tokenHash, expiresAt: expiry });
  return { token, expiresAt: expiry };
}

export async function getSharedTrip(rawToken: string) {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(rawToken)) return null;
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const now = new Date();
  const [row] = await db.select({
    share: tripShares,
    booking: bookings,
    journey: journeys,
    car: cars,
    driver: { name: users.name, image: users.profilePhoto, verified: users.verified },
    location: tripLocations,
  }).from(tripShares)
    .innerJoin(bookings, eq(tripShares.bookingId, bookings.id))
    .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
    .innerJoin(cars, eq(journeys.carId, cars.id))
    .innerJoin(users, eq(journeys.driverId, users.id))
    .leftJoin(tripLocations, eq(bookings.id, tripLocations.bookingId))
    .where(and(eq(tripShares.tokenHash, tokenHash), isNull(tripShares.revokedAt), gt(tripShares.expiresAt, now)))
    .orderBy(desc(tripShares.createdAt)).limit(1);
  if (!row || row.booking.status !== "confirmed" || !["active", "ongoing"].includes(row.journey.status)) return null;
  if (row.location && row.location.recordedAt.getTime() < now.getTime() - 2 * 60_000)
    row.location = null;
  return row;
}

export async function recordTripLocation(userId: string, bookingId: string, input: unknown) {
  await limit(`location:${userId}:${bookingId}`, 8, 60_000);
  const point = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), accuracy: z.number().min(0).max(100000).optional() }).parse(input);
  const [row] = await db.select({ booking: bookings, journey: journeys }).from(bookings)
    .innerJoin(journeys, eq(bookings.journeyId, journeys.id)).where(eq(bookings.id, bookingId));
  if (!row || (row.booking.clientId !== userId && row.journey.driverId !== userId) || row.booking.status !== "confirmed" || !["active", "ongoing"].includes(row.journey.status))
    throw new DomainError("location", "Location sharing is available only to riders on an active trip.");
  const now = new Date();
  await db.insert(tripLocations).values({ bookingId, latitude: String(point.latitude), longitude: String(point.longitude), accuracyMeters: point.accuracy ? Math.round(point.accuracy) : null, recordedAt: now })
    .onConflictDoUpdate({ target: tripLocations.bookingId, set: { latitude: String(point.latitude), longitude: String(point.longitude), accuracyMeters: point.accuracy ? Math.round(point.accuracy) : null, recordedAt: now } });
}

export async function clearTripLocation(userId: string, bookingId: string) {
  const [row] = await db.select({ clientId: bookings.clientId, driverId: journeys.driverId }).from(bookings)
    .innerJoin(journeys, eq(bookings.journeyId, journeys.id)).where(eq(bookings.id, bookingId));
  if (!row || (row.clientId !== userId && row.driverId !== userId))
    throw new DomainError("location", "Booking not found.");
  await db.delete(tripLocations).where(eq(tripLocations.bookingId, bookingId));
}

export async function revokeTripShares(userId: string, bookingId: string) {
  await db.update(tripShares).set({ revokedAt: new Date() }).where(and(eq(tripShares.ownerId, userId), eq(tripShares.bookingId, bookingId), isNull(tripShares.revokedAt)));
}

export async function raiseEmergencyAlert(userId: string, bookingId: string, input?: unknown) {
  await limit(`sos:${userId}`, 3, 60_000);
  const point = input == null ? {} : z.object({ latitude: z.number().min(-90).max(90).optional(), longitude: z.number().min(-180).max(180).optional() }).parse(input);
  await db.transaction(async (tx) => {
    const [row] = await tx.select({ booking: bookings, journey: journeys }).from(bookings)
      .innerJoin(journeys, eq(bookings.journeyId, journeys.id)).where(eq(bookings.id, bookingId)).for("update", { of: bookings });
    if (!row || (row.booking.clientId !== userId && row.journey.driverId !== userId) || row.booking.status !== "confirmed" || !["active", "ongoing"].includes(row.journey.status))
      throw new DomainError("emergency", "Emergency alerts are available only during a confirmed active trip.");
    const alert = await tx.insert(emergencyAlerts).values({ bookingId, userId, message: "In-app emergency alert submitted during an active ride.", latitude: point.latitude == null ? null : String(point.latitude), longitude: point.longitude == null ? null : String(point.longitude) }).returning();
    await tx.insert(supportCases).values({ userId, bookingId, emergencyAlertId: alert[0].id, subject: "EMERGENCY — active ride alert", message: `The rider requested urgent assistance.${point.latitude == null ? " No location was attached." : ` Approximate coordinates: ${point.latitude}, ${point.longitude}.`}` });
    await audit(tx, userId, "ride.emergency_alert", alert[0].id, { bookingId });
  });
}

export async function getSharedLocation(rawToken: string) {
  const trip = await getSharedTrip(rawToken);
  if (!trip) return null;
  return trip.location ? { latitude: trip.location.latitude, longitude: trip.location.longitude, accuracyMeters: trip.location.accuracyMeters, recordedAt: trip.location.recordedAt } : null;
}
