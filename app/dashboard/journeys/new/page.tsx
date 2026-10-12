import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { cars, users } from "@/db/schema";
import { requireRole } from "@/lib/auth/roles";
import { Notice } from "@/components/shared/notice";
import { JourneyForm } from "./journey-form";
export default async function NewJourney({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { userId } = await requireRole("driver");
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const approved = await db
    .select({
      id: cars.id,
      name: cars.name,
      seats: cars.seats,
      luggageCapacity: cars.luggageCapacity,
    })
    .from(cars)
    .where(and(eq(cars.driverId, userId), eq(cars.verified, true)));
  return (
    <div className="page-content max-w-3xl">
      <h1 className="page-title">Offer a ride</h1>
      <p className="page-description">Make room for a better journey.</p>
      <Notice error={(await searchParams).error} />
      {!user.verified || !user.emailVerified ? (
        <div className="panel">
          Complete your{" "}
          <Link className="text-primary" href="/dashboard/profile">
            identity and email verification
          </Link>{" "}
          before publishing.
        </div>
      ) : !approved.length ? (
        <div className="panel">
          Add and verify a{" "}
          <Link className="text-primary" href="/dashboard/cars">
            vehicle
          </Link>{" "}
          before publishing.
        </div>
      ) : (
        <JourneyForm cars={approved} />
      )}
    </div>
  );
}
