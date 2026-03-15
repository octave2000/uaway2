import { auth } from "@/auth";
import { db } from "@/db";
import { journeys, users, cars, bookings, payments } from "@/db/schema";
import { eq, desc, and, ne, count, sum } from "drizzle-orm";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardHome() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch stats concurrently
  const [
    ridesTakenCount,
    ridesHostedCount,
    totalSpentSum,
    totalEarnedSum,
    recentJourneys,
    upcomingBookings,
    myActiveJourneys,
    pendingBookings
  ] = await Promise.all([
    // Passenger Stats
    db.select({ count: count() }).from(bookings).where(eq(bookings.clientId, userId)),
    // Driver Stats
    db.select({ count: count() }).from(journeys).where(eq(journeys.driverId, userId)),
    // Financials
    db.select({ total: sum(payments.amount) }).from(payments).innerJoin(bookings, eq(payments.bookingId, bookings.id)).where(eq(bookings.clientId, userId)),
    db.select({ total: sum(payments.amount) }).from(payments).innerJoin(bookings, eq(payments.bookingId, bookings.id)).innerJoin(journeys, eq(bookings.journeyId, journeys.id)).where(eq(journeys.driverId, userId)),
    // Passenger Data: Feeds & Upcoming
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
      .limit(1),
    // Driver Data: Managed Journeys & Requests
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
    <DashboardShell 
      userName={session.user.name || "User"}
      userImage={session.user.image}
      stats={{
        ridesTaken: ridesTakenCount[0].count,
        ridesHosted: ridesHostedCount[0].count,
        totalSpent: Number(totalSpentSum[0].total || 0),
        totalEarned: Number(totalEarnedSum[0].total || 0)
      }}
      passengerData={{
        recentJourneys,
        upcomingBooking: upcomingBookings[0] || null
      }}
      driverData={{
        myActiveJourneys,
        pendingBookingsCount: pendingBookings[0].count
      }}
    />
  );
}
