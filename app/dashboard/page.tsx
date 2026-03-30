import { db } from "@/db";
import { bookings, cars, journeys, payments, payoutRequests, users } from "@/db/schema";
import { eq, desc, and, ne, count, isNotNull } from "drizzle-orm";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { OnboardingGate } from "@/components/dashboard/onboarding-gate";
import { PassengerDashboard } from "@/components/dashboard/passenger-dashboard";
import { DriverDashboard } from "@/components/dashboard/driver-dashboard";
import { requireAuthenticatedUser } from "@/lib/auth/roles";
import { autoCompleteExpiredJourneys } from "@/lib/journeys/lifecycle";

export default async function DashboardHome() {
  const { userId, role, name } = await requireAuthenticatedUser();

  await autoCompleteExpiredJourneys();

  if (!role) {
    return <OnboardingGate />;
  }

  if (role === "super_admin") {
    const [
      totalUsersResult,
      activeJourneysResult,
      totalBookingsResult,
      successfulPaymentsResult,
      pendingPayoutRequestsResult,
      pendingUsers,
      pendingVehicles,
      recentPayments,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db
        .select({ count: count() })
        .from(journeys)
        .where(eq(journeys.status, "active")),
      db.select({ count: count() }).from(bookings),
      db
        .select({ amount: payments.amount })
        .from(payments)
        .where(eq(payments.status, "success")),
      db
        .select({ count: count() })
        .from(payoutRequests)
        .where(eq(payoutRequests.status, "pending")),
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
        })
        .from(users)
        .where(
          and(
            eq(users.verified, false),
            isNotNull(users.idPhoto),
            isNotNull(users.selfiePhoto),
          ),
        )
        .limit(4),
      db
        .select({
          id: cars.id,
          name: cars.name,
          plateNumber: cars.plateNumber,
          driverName: users.name,
        })
        .from(cars)
        .innerJoin(users, eq(cars.driverId, users.id))
        .where(and(eq(cars.verified, false), isNotNull(cars.documentPhoto)))
        .limit(4),
      db
        .select({
          id: payments.id,
          amount: payments.amount,
          status: payments.status,
          passengerName: users.name,
          origin: journeys.origin,
          destination: journeys.destination,
        })
        .from(payments)
        .innerJoin(bookings, eq(payments.bookingId, bookings.id))
        .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
        .innerJoin(users, eq(bookings.clientId, users.id))
        .orderBy(desc(payments.createdAt))
        .limit(3),
    ]);

    return (
      <AdminDashboard
        userName={name || "Admin"}
        stats={{
          totalUsers: totalUsersResult[0]?.count ?? 0,
          activeJourneys: activeJourneysResult[0]?.count ?? 0,
          totalBookings: totalBookingsResult[0]?.count ?? 0,
          successfulPayments: successfulPaymentsResult.reduce((sum, row) => sum + row.amount, 0),
          pendingIdentityReviews: pendingUsers.length,
          pendingVehicleReviews: pendingVehicles.length,
          pendingPayoutRequests: pendingPayoutRequestsResult[0]?.count ?? 0,
        }}
        pendingUsers={pendingUsers}
        pendingVehicles={pendingVehicles}
        recentPayments={recentPayments}
      />
    );
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
    const [myActiveJourneys, pendingPayoutRequests] = await Promise.all([
      db.select()
        .from(journeys)
        .where(and(eq(journeys.driverId, userId), ne(journeys.status, "completed")))
        .orderBy(desc(journeys.createdAt)),
      db.select({ count: count() })
        .from(payoutRequests)
        .where(and(eq(payoutRequests.driverId, userId), eq(payoutRequests.status, "pending")))
    ]);

    const pendingRideActions = myActiveJourneys.filter(
      (journey) =>
        (journey.status === "active" && Boolean(journey.startRequestedAt)) ||
        (journey.status === "ongoing" && Boolean(journey.endRequestedAt)),
    ).length;

    return (
      <DriverDashboard 
        userName={name || "User"}
        activeJourneys={myActiveJourneys}
        actionItemsCount={pendingRideActions + pendingPayoutRequests[0].count}
      />
    );
  }
}
