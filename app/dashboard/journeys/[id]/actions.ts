"use server"

import { auth } from "@/auth";
import { db } from "@/db";
import { bookings, payments, journeys, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { HubMail } from "hubmail";

const hubmail = new HubMail({ apiKey: process.env.HUBMAIL_KEY });

export async function bookJourneyAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const journeyId = formData.get("journeyId") as string;
  const seatsBooked = parseInt(formData.get("seatsBooked") as string, 10);
  const luggageSpace = parseInt(formData.get("luggageSpace") as string, 10);
  const pricePerSeat = parseInt(formData.get("pricePerSeat") as string, 10);
  const totalAmount = pricePerSeat * seatsBooked;

  // Generate a random 6-character alphanumeric booking code
  const bookingCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Create booking
  const [newBooking] = await db.insert(bookings).values({
    clientId: session.user.id,
    journeyId: journeyId,
    seatsBooked,
    luggageSpace,
    bookingCode,
    status: "confirmed", // Mocking payment success here
  }).returning({ id: bookings.id });

  // Create simulated payment
  await db.insert(payments).values({
    bookingId: newBooking.id,
    amount: totalAmount,
    status: "success",
    reference: `MPESA-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  });

  // Decrease available seats and luggage on journey
  await db.update(journeys).set({
    seatsAvailable: sql`${journeys.seatsAvailable} - ${seatsBooked}`,
    luggageCapacity: sql`${journeys.luggageCapacity} - ${luggageSpace}`
  }).where(eq(journeys.id, journeyId));

  try {
    const [journeyDetails] = await db.select({
      driverEmail: users.email,
      origin: journeys.origin,
      destination: journeys.destination
    }).from(journeys).innerJoin(users, eq(journeys.driverId, users.id)).where(eq(journeys.id, journeyId));

    if (session.user.email) {
      await hubmail.send({
        from: "notifications@uaway.app",
        to: [session.user.email],
        subject: "Booking Confirmed - UAWAY",
        text: `Your booking for ${journeyDetails.origin} to ${journeyDetails.destination} is confirmed. Your booking code is ${bookingCode}. Please provide this to the driver when the ride ends.`,
        html: `<b>Booking Confirmed</b><p>Route: ${journeyDetails.origin} to ${journeyDetails.destination}</p><p>Booking Code: <b>${bookingCode}</b></p>`,
      });
    }

    if (journeyDetails.driverEmail) {
       await hubmail.send({
        from: "notifications@uaway.app",
        to: [journeyDetails.driverEmail],
        subject: "New Booking for Your Journey - UAWAY",
        text: `Someone just booked ${seatsBooked} seats on your journey from ${journeyDetails.origin} to ${journeyDetails.destination}.`,
        html: `<b>New Booking</b><p>You have a new passenger for your journey from ${journeyDetails.origin} to ${journeyDetails.destination}. Seats booked: ${seatsBooked}</p>`,
      });
    }
  } catch(error) {
    console.error("HubMail Error: ", error);
  }

  redirect("/dashboard/bookings");
}
