import "dotenv/config";
import { randomUUID, createHash } from "node:crypto";
import { hash } from "bcryptjs";
import postgres from "postgres";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const sql = postgres(process.env.DATABASE_URL, {
  prepare: false,
  connect_timeout: 10,
});
const id = (key) => {
  const hex = createHash("sha256").update(`uaway-demo-v2:${key}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};
const at = (hours) => new Date(Date.now() + hours * 3600000);
const password = "SeedPass123!";

try {
  const passwordHash = await hash(password, 12);
  await sql.begin(async (tx) => {
    // Stable identifiers make reruns additive, preserving changes made while testing.
    await tx`select pg_advisory_xact_lock(7834512)`;
    for (const [key, name, role] of [
      ["grace", "Grace Wambui", "driver"],
      ["brian", "Brian Otieno", "driver"],
      ["amina", "Amina Hassan", "passenger"],
      ["daniel", "Daniel Mwangi", "passenger"],
      ["admin", "Demo Administrator", "passenger"],
    ]) {
      await tx`insert into users ${tx({ id: id(key), name, email: `${key}@seed.uaway.local`, password_hash: passwordHash, verified: true, email_verified: new Date(), default_role: role })} on conflict do nothing`;
    }
    await tx`insert into admin_grants (user_id) values (${id("admin")}) on conflict do nothing`;
    for (const [key, owner, name, plate] of [
      ["fielder", "grace", "Toyota Fielder Hybrid", "DEMO 001"],
      ["outback", "brian", "Subaru Outback", "DEMO 002"],
    ]) {
      await tx`insert into cars ${tx({ id: id(key), driver_id: id(owner), name, plate_number: plate, seats: 4, luggage_capacity: 40, verified: true })} on conflict do nothing`;
    }
    const routes = [
      ["nakuru", "grace", "fielder", "Nairobi", "Nakuru", 4, 800],
      ["naivasha", "brian", "outback", "Nairobi", "Naivasha", 8, 600],
      ["mombasa", "grace", "fielder", "Nairobi", "Mombasa", 24, 2500],
      ["kisumu", "brian", "outback", "Nakuru", "Kisumu", 28, 1200],
      ["eldoret", "grace", "fielder", "Nakuru", "Eldoret", 48, 1000],
      ["return", "brian", "outback", "Naivasha", "Nairobi", 52, 600],
      ["ongoing", "grace", "fielder", "Kisumu", "Eldoret", -1, 900],
      ["completed", "brian", "outback", "Mombasa", "Nairobi", -20, 2500],
    ];
    for (const [
      key,
      driver,
      car,
      origin,
      destination,
      hours,
      price,
    ] of routes) {
      const booked = ["nakuru", "ongoing", "completed"].includes(key);
      const completed = key === "completed";
      const ongoing = key === "ongoing";
      const [journey] = await tx`insert into journeys ${tx({
        id: id(key),
        driver_id: id(driver),
        car_id: id(car),
        origin,
        destination,
        departure_time: at(hours),
        seats_available: booked ? 3 : 4,
        luggage_capacity: booked ? 35 : 40,
        price_per_seat: price,
        note: "Demo ride for testing. No real trip or payment.",
        status: completed ? "completed" : ongoing ? "ongoing" : "active",
        started_at: completed ? at(-20) : ongoing ? at(-1) : null,
        end_requested_at: completed ? at(-10) : null,
        completed_at: completed ? at(-10) : null,
      })} on conflict do nothing returning id`;
      if (!journey || !booked) continue;
      const bookingId = id(`booking-${key}`);
      const paymentId = id(`payment-${key}`);
      const passenger = ongoing ? "daniel" : "amina";
      await tx`insert into bookings ${tx({
        id: bookingId,
        client_id: id(passenger),
        journey_id: journey.id,
        seats_booked: 1,
        luggage_space: 5,
        booking_code: completed ? "DONE01" : ongoing ? "RIDE01" : "DEMO01",
        idempotency_key: `demo-${key}`,
        inventory_held: true,
        fare_minor: price * 100,
        fee_minor: 0,
        status: completed ? "completed" : "confirmed",
        confirmed_at: at(-24),
        boarded_at: completed ? at(-20) : ongoing ? at(-1) : null,
        completed_at: completed ? at(-10) : null,
      })}`;
      await tx`insert into payments ${tx({
        id: paymentId,
        booking_id: bookingId,
        amount: price,
        amount_minor: price * 100,
        status: "success",
        currency: "KES",
        provider: "demo",
        payment_method: "demo",
        tx_ref: `demo-${key}`,
        reference: `DEMO-${key}`,
        provider_status: "demo_seeded",
        paid_at: at(-24),
        verified_at: at(-24),
        next_check_at: null,
      })}`;
      await tx`insert into ledger_entries ${tx({ id: randomUUID(), key: `collection:${paymentId}`, payment_id: paymentId, debit: "mpesa_clearing", credit: "passenger_funds", amount_minor: price * 100, currency: "KES" })}`;
      if (completed)
        await tx`insert into reviews ${tx({ id: id("review"), journey_id: journey.id, client_id: id(passenger), driver_id: id(driver), rating: 5, comment: "Demo review: comfortable ride and clear pickup instructions." })}`;
    }
  });
  console.log(
    "Demo data ready: 5 accounts, 2 cars, 8 rides, 3 paid sample bookings. Reruns preserve existing records.",
  );
  console.log(
    "Accounts: amina, daniel (passengers); grace, brian (drivers); admin (MFA enrollment required).",
  );
  console.log("Email domain: @seed.uaway.local. Password: SeedPass123!");
} catch (error) {
  console.error("Seed failed:", error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
