import "dotenv/config";

import crypto from "node:crypto";

import { hash } from "bcryptjs";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run the seed script.");
}

const sql = postgres(databaseUrl, { prepare: false });
const sampleDomain = "seed.uaway.local";

function createId() {
  return crypto.randomUUID();
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function seed() {
  const passwordHash = await hash("SeedPass123!", 10);

  const driverAId = createId();
  const driverBId = createId();
  const passengerAId = createId();
  const passengerBId = createId();
  const passengerCId = createId();

  const carAId = createId();
  const carBId = createId();
  const carCId = createId();

  const activeJourneyId = createId();
  const ongoingJourneyId = createId();
  const completedJourneyId = createId();
  const pendingJourneyId = createId();
  const failedJourneyId = createId();

  const confirmedBookingId = createId();
  const ongoingBookingId = createId();
  const completedBookingId = createId();
  const pendingBookingId = createId();
  const failedBookingId = createId();

  const confirmedPaymentId = createId();
  const ongoingPaymentId = createId();
  const completedPaymentId = createId();
  const pendingPaymentId = createId();
  const failedPaymentId = createId();

  const standardPayoutRequestId = createId();
  const advancePayoutRequestId = createId();
  const reviewId = createId();

  await sql.begin(async (tx) => {
    await tx`delete from users where email like ${"%" + sampleDomain}`;

    await tx`
      insert into users (
        id, name, email, password_hash, verified, phone, default_role, email_verified
      ) values
        (${driverAId}, 'Grace Wambui', ${`grace@${sampleDomain}`}, ${passwordHash}, true, '+254711000001', 'driver', now()),
        (${driverBId}, 'Brian Otieno', ${`brian@${sampleDomain}`}, ${passwordHash}, true, '+254711000002', 'driver', now()),
        (${passengerAId}, 'Amina Hassan', ${`amina@${sampleDomain}`}, ${passwordHash}, true, '+254711000003', 'passenger', now()),
        (${passengerBId}, 'Daniel Mwangi', ${`daniel@${sampleDomain}`}, ${passwordHash}, true, '+254711000004', 'passenger', now()),
        (${passengerCId}, 'Lucy Naliaka', ${`lucy@${sampleDomain}`}, ${passwordHash}, true, '+254711000005', 'passenger', now())
    `;

    await tx`
      insert into cars (
        id, driver_id, name, plate_number, seats, luggage_capacity, verified, document_photo, created_at
      ) values
        (${carAId}, ${driverAId}, 'Toyota Fielder Hybrid', 'KDA 234H', 4, 80, true, 'sample-doc-a.jpg', now()),
        (${carBId}, ${driverAId}, 'Mazda Demio Skyactiv', 'KDL 908M', 3, 55, true, 'sample-doc-b.jpg', now()),
        (${carCId}, ${driverBId}, 'Subaru Outback Touring', 'KCR 552T', 4, 120, true, 'sample-doc-c.jpg', now())
    `;

    await tx`
      insert into journeys (
        id, driver_id, car_id, origin, destination, departure_time, seats_available, luggage_capacity,
        price_per_seat, status, start_requested_by_client_id, start_requested_at, started_at,
        end_requested_at, end_confirmed_by_client_id, completed_at, created_at
      ) values
        (
          ${activeJourneyId}, ${driverAId}, ${carAId}, 'Nairobi', 'Nakuru',
          ${hoursAgo(-4)}, 2, 70, 1800, 'active',
          ${passengerAId}, ${hoursAgo(0.5)}, null, null, null, null, ${hoursAgo(5)}
        ),
        (
          ${ongoingJourneyId}, ${driverAId}, ${carBId}, 'Kisumu', 'Eldoret',
          ${hoursAgo(-1)}, 2, 45, 2200, 'ongoing',
          ${passengerBId}, ${hoursAgo(2)}, ${hoursAgo(1.5)}, null, null, null, ${hoursAgo(6)}
        ),
        (
          ${completedJourneyId}, ${driverBId}, ${carCId}, 'Mombasa', 'Nairobi',
          ${hoursAgo(10)}, 2, 90, 3500, 'completed',
          ${passengerCId}, ${hoursAgo(10)}, ${hoursAgo(9.5)}, ${hoursAgo(7)}, ${passengerCId}, ${hoursAgo(6.5)}, ${hoursAgo(12)}
        ),
        (
          ${pendingJourneyId}, ${driverBId}, ${carCId}, 'Nairobi', 'Meru',
          ${hoursAgo(-8)}, 4, 120, 2000, 'active',
          null, null, null, null, null, null, ${hoursAgo(1)}
        ),
        (
          ${failedJourneyId}, ${driverBId}, ${carCId}, 'Thika', 'Nyeri',
          ${hoursAgo(-6)}, 4, 120, 1600, 'active',
          null, null, null, null, null, null, ${hoursAgo(0.5)}
        )
    `;

    await tx`
      insert into bookings (
        id, client_id, journey_id, seats_booked, luggage_space, booking_code, status, confirmed_at, completed_at, created_at
      ) values
        (${confirmedBookingId}, ${passengerAId}, ${activeJourneyId}, 1, 10, 'START1', 'confirmed', ${hoursAgo(1)}, null, ${hoursAgo(1)}),
        (${ongoingBookingId}, ${passengerBId}, ${ongoingJourneyId}, 1, 10, 'ADVNC1', 'confirmed', ${hoursAgo(2)}, null, ${hoursAgo(2)}),
        (${completedBookingId}, ${passengerCId}, ${completedJourneyId}, 2, 20, 'DONE22', 'completed', ${hoursAgo(9)}, ${hoursAgo(6.5)}, ${hoursAgo(9.5)}),
        (${pendingBookingId}, ${passengerAId}, ${pendingJourneyId}, 1, 5, 'PEND44', 'payment_pending', null, null, ${hoursAgo(0.5)}),
        (${failedBookingId}, ${passengerBId}, ${failedJourneyId}, 1, 0, 'FAIL55', 'payment_failed', null, null, ${hoursAgo(0.25)})
    `;

    await tx`
      insert into payments (
        id, booking_id, amount, status, currency, provider, payment_method, phone_number, tx_ref,
        provider_transaction_id, provider_status, checkout_url, reference, paid_at, verified_at, created_at
      ) values
        (
          ${confirmedPaymentId}, ${confirmedBookingId}, 1800, 'success', 'KES', 'daraja', 'mpesa',
          '254711000003', 'seed-start-txref', '100001', 'successful', null, 'FLW-START-001',
          ${hoursAgo(1)}, ${hoursAgo(1)}, ${hoursAgo(1)}
        ),
        (
          ${ongoingPaymentId}, ${ongoingBookingId}, 2200, 'success', 'KES', 'daraja', 'mpesa',
          '254711000004', 'seed-advance-txref', '100002', 'successful', null, 'FLW-ADV-002',
          ${hoursAgo(2)}, ${hoursAgo(2)}, ${hoursAgo(2)}
        ),
        (
          ${completedPaymentId}, ${completedBookingId}, 7000, 'success', 'KES', 'daraja', 'mpesa',
          '254711000005', 'seed-standard-txref', '100003', 'successful', null, 'FLW-STD-003',
          ${hoursAgo(8)}, ${hoursAgo(8)}, ${hoursAgo(8)}
        ),
        (
          ${pendingPaymentId}, ${pendingBookingId}, 2000, 'pending', 'KES', 'daraja', 'mpesa',
          '254711000003', 'seed-pending-txref', '100004', 'pending', null, 'FLW-PEND-004',
          null, null, ${hoursAgo(0.5)}
        ),
        (
          ${failedPaymentId}, ${failedBookingId}, 1600, 'failed', 'KES', 'daraja', 'mpesa',
          '254711000004', 'seed-failed-txref', '100005', 'failed', null, 'FLW-FAIL-005',
          null, ${hoursAgo(0.2)}, ${hoursAgo(0.25)}
        )
    `;

    await tx`
      insert into payout_requests (
        id, payment_id, booking_id, driver_id, client_id, amount, type, status, note, responded_at, created_at
      ) values
        (
          ${standardPayoutRequestId}, ${completedPaymentId}, ${completedBookingId}, ${driverBId}, ${passengerCId},
          7000, 'standard', 'approved', 'Seeded standard payout after the 6-hour release window.',
          ${hoursAgo(5.5)}, ${hoursAgo(5.8)}
        ),
        (
          ${advancePayoutRequestId}, ${ongoingPaymentId}, ${ongoingBookingId}, ${driverAId}, ${passengerBId},
          2200, 'advance', 'pending', 'Seeded advance payout awaiting passenger approval.',
          null, ${hoursAgo(0.5)}
        )
    `;

    await tx`
      insert into reviews (
        id, journey_id, client_id, driver_id, rating, comment, created_at
      ) values
        (
          ${reviewId}, ${completedJourneyId}, ${passengerCId}, ${driverBId}, 5,
          'Comfortable car, smooth ride, and great communication the whole way.',
          ${hoursAgo(5)}
        )
    `;
  });

  console.log("Seed data created successfully.");
  console.log("Sample login password: SeedPass123!");
  console.log(`Sample accounts use the @${sampleDomain} domain.`);
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
