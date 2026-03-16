import { db } from "@/db";
import { bookings, cars, journeys, users } from "@/db/schema";
import { eq, desc, and, ne, count } from "drizzle-orm";
import { OnboardingGate } from "@/components/dashboard/onboarding-gate";
import { PassengerDashboard } from "@/components/dashboard/passenger-dashboard";
import { DriverDashboard } from "@/components/dashboard/driver-dashboard";
import { requireAuthenticatedUser } from "@/lib/auth/roles";

export default async function DashboardHome() {
  const { userId, role, name } = await requireAuthenticatedUser();

  if (!role) {
    return <OnboardingGate />;
  }

  // Fetch role-specific data
  if (role === "passenger") {
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
        userName={name || "User"}
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
        userName={name || "User"}
        activeJourneys={myActiveJourneys}
        pendingBookingsCount={pendingBookings[0].count}
      />
    );
  }
}
