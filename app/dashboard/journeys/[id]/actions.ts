"use server"

import { and, eq, notInArray } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { bookings, journeys, payments, users } from "@/db/schema";
import { requireRole } from "@/lib/auth/roles";
import { createMpesaCharge, normalizeMpesaPhoneNumber } from "@/lib/payments/flutterwave";

export async function bookJourneyAction(formData: FormData) {
  const { userId, email, name } = await requireRole("passenger");

  const journeyId = formData.get("journeyId") as string;
  const seatsBooked = parseInt(formData.get("seatsBooked") as string, 10);
  const luggageSpace = parseInt(formData.get("luggageSpace") as string, 10);
  const paymentPhone = formData.get("paymentPhone") as string;

  if (
    !journeyId ||
    !email ||
    Number.isNaN(seatsBooked) ||
    Number.isNaN(luggageSpace) ||
    seatsBooked < 1 ||
    luggageSpace < 0 ||
    !paymentPhone
  ) {
    redirect("/dashboard/journeys");
  }

  const normalizedPhone = normalizeMpesaPhoneNumber(paymentPhone);

  const [journey] = await db
    .select({
      id: journeys.id,
      driverId: journeys.driverId,
      status: journeys.status,
      seatsAvailable: journeys.seatsAvailable,
      luggageCapacity: journeys.luggageCapacity,
      pricePerSeat: journeys.pricePerSeat,
      origin: journeys.origin,
      destination: journeys.destination,
    })
    .from(journeys)
    .where(eq(journeys.id, journeyId))
    .limit(1);

  if (
    !journey ||
    journey.status !== "active" ||
    journey.driverId === userId ||
    seatsBooked > journey.seatsAvailable ||
    luggageSpace > journey.luggageCapacity
  ) {
    redirect(`/dashboard/journeys/${journeyId}`);
  }

  const [existingBooking] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.clientId, userId),
        eq(bookings.journeyId, journeyId),
        notInArray(bookings.status, ["cancelled", "payment_failed"]),
      ),
    )
    .limit(1);

  if (existingBooking) {
    redirect("/dashboard/bookings");
  }

  const bookingCode = crypto.randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase();
  const txRef = `uaway-${journey.id.slice(0, 8)}-${crypto.randomUUID().slice(0, 8)}`;
  const totalAmount = journey.pricePerSeat * seatsBooked;

  await db
    .update(users)
    .set({ phone: paymentPhone })
    .where(eq(users.id, userId));

  const [newBooking] = await db
    .insert(bookings)
    .values({
      clientId: userId,
      journeyId,
      seatsBooked,
      luggageSpace,
      bookingCode,
      status: "payment_pending",
    })
    .returning({ id: bookings.id });

  const [newPayment] = await db
    .insert(payments)
    .values({
      bookingId: newBooking.id,
      amount: totalAmount,
      currency: "KES",
      provider: "flutterwave",
      paymentMethod: "mpesa",
      phoneNumber: normalizedPhone,
      txRef,
      status: "pending",
      providerStatus: "pending",
    })
    .returning({ id: payments.id });

  try {
    const charge = await createMpesaCharge({
      amount: totalAmount,
      email,
      fullname: name || email,
      phoneNumber: normalizedPhone,
      txRef,
      meta: {
        bookingId: newBooking.id,
        paymentId: newPayment.id,
        journeyId: journey.id,
      },
    });

    await db
      .update(payments)
      .set({
        providerTransactionId: String(charge.id),
        providerStatus: charge.status,
        reference: charge.flw_ref,
      })
      .where(eq(payments.id, newPayment.id));
  } catch {
    await db
      .update(bookings)
      .set({ status: "payment_failed" })
      .where(eq(bookings.id, newBooking.id));

    await db
      .update(payments)
      .set({
        status: "failed",
        providerStatus: "initiation_failed",
      })
      .where(eq(payments.id, newPayment.id));

    redirect(`/dashboard/journeys/${journeyId}?error=payment_failed`);
  }

  redirect("/dashboard/bookings?notice=payment_pending");
}
