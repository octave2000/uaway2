import { and, asc, eq, gt, gte, lt, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { journeys, cars, users } from "@/db/schema";
import { nairobiDay } from "./policy";
import { normalizePlace, placeKey } from "./locations";
export async function searchRides(
  params: Record<string, string | string[] | undefined>,
) {
  const text = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string) : "";
  const page = Math.min(1000, Math.max(1, Number(text("page")) || 1));
  const seats = Math.min(8, Math.max(1, Number(text("seats")) || 1));
  const filters = [
    eq(journeys.status, "active"),
    gt(journeys.departureTime, new Date()),
    gte(journeys.seatsAvailable, seats),
    eq(users.verified, true),
    eq(users.suspended, false),
    eq(cars.verified, true),
    ne(journeys.origin, journeys.destination),
  ];
  const origin = normalizePlace(text("origin"));
  const destination = normalizePlace(text("destination"));
  if (origin)
    filters.push(sql`lower(trim(${journeys.origin})) = ${placeKey(origin)}`);
  if (destination)
    filters.push(
      sql`lower(trim(${journeys.destination})) = ${placeKey(destination)}`,
    );
  if (text("date")) {
    const [start, end] = nairobiDay(text("date"));
    filters.push(
      gte(journeys.departureTime, start),
      lt(journeys.departureTime, end),
    );
  }
  const rows = await db
    .select({
      journey: journeys,
      car: { name: cars.name, photo: cars.photo, insuranceVerifiedAt: cars.insuranceVerifiedAt, insuranceExpiry: cars.insuranceExpiry },
      driver: { name: users.name, image: users.profilePhoto, fallbackImage: users.image },
    })
    .from(journeys)
    .innerJoin(cars, eq(journeys.carId, cars.id))
    .innerJoin(users, eq(journeys.driverId, users.id))
    .where(and(...filters))
    .orderBy(asc(journeys.departureTime), asc(journeys.id))
    .limit(13)
    .offset((page - 1) * 12);
  return { rows: rows.slice(0, 12), hasNext: rows.length > 12, page };
}
