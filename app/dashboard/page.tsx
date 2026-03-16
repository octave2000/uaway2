import { auth } from "@/auth";
import { db } from "@/db";
import { journeys, users, cars, bookings } from "@/db/schema";
import { eq, desc, and, ne, count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { OnboardingGate } from "@/components/dashboard/onboarding-gate";
import { PassengerDashboard } from "@/components/dashboard/passenger-dashboard";
import { DriverDashboard } from "@/components/dashboard/driver-dashboard";

export default async function DashboardHome() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch the user's default role
  const [userRecord] = await db
    .select({ defaultRole: users.defaultRole })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const defaultRole = userRecord?.defaultRole as "passenger" | "driver" | null;

  if (!defaultRole) {
    return <OnboardingGate />;
  }

  // Fetch role-specific data
  if (defaultRole === "passenger") {
    const [recentJourneys, upcomingBooking] = await Promise.all([
      db.select({
        journey: journeys,
        driver: { name: users.name, image: users.image },
        car: { name: cars.name }
      }).from(journeys)
        .innerJoin(users, eq(journeys.driverId, users.id))
        .innerJoin(cars, eq(journeys.carId, cars.id))
        .where(and(eq(journeys.status, "active"), ne(journeys.driverId, userId)))
        .orderBy(desc(journeys.createdAt))
        .limit(3),
      db.select({
        booking: bookings,
        journey: journeys,
        driver: { name: users.name, image: users.image }
      }).from(bookings)
        .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
        .innerJoin(users, eq(journeys.driverId, users.id))
        .where(and(eq(bookings.clientId, userId), eq(bookings.status, "confirmed")))
        .orderBy(desc(journeys.departureTime))
        .limit(1)
    ]);

    return (
      <PassengerDashboard 
        userName={session.user.name || "User"}
        recentJourneys={recentJourneys}
        upcomingBooking={upcomingBooking[0] || null}
      />
    );
  } else {
    // Driver Data
    const [myActiveJourneys, pendingBookings] = await Promise.all([
      db.select()
        .from(journeys)
        .where(and(eq(journeys.driverId, userId), ne(journeys.status, "completed")))
        .orderBy(desc(journeys.createdAt)),
      db.select({ count: count() })
        .from(bookings)
        .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
        .where(and(eq(journeys.driverId, userId), eq(bookings.status, "pending")))
    ]);

    return (
      <DriverDashboard 
        userName={session.user.name || "User"}
        activeJourneys={myActiveJourneys}
        pendingBookingsCount={pendingBookings[0].count}
      />
    );
  }
}
