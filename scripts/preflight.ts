import "dotenv/config";
import postgres from "postgres";
const client = postgres(process.env.DATABASE_URL!);
const checks: Record<string, string> = {
  negative_inventory:
    "SELECT id FROM journeys WHERE seats_available < 0 OR luggage_capacity < 0 OR price_per_seat < 50",
  invalid_journey_prices: "SELECT id FROM journeys WHERE price_per_seat < 50",
  invalid_booking_capacity:
    "SELECT id FROM bookings WHERE seats_booked < 1 OR luggage_space < 0",
  duplicate_active_bookings:
    "SELECT client_id, journey_id FROM bookings WHERE status NOT IN ('cancelled','payment_failed') GROUP BY client_id,journey_id HAVING count(*) > 1",
  duplicate_payouts:
    "SELECT payment_id FROM payout_requests WHERE status <> 'rejected' GROUP BY payment_id HAVING count(*) > 1",
  duplicate_provider_ids:
    "SELECT provider,provider_transaction_id FROM payments WHERE provider_transaction_id IS NOT NULL GROUP BY provider,provider_transaction_id HAVING count(*) > 1",
  duplicate_reviews:
    "SELECT client_id,journey_id FROM reviews GROUP BY client_id,journey_id HAVING count(*) > 1",
};
let failed = false;
for (const [name, query] of Object.entries(checks)) {
  const rows = await client.unsafe(query);
  console.log(`${name}: ${rows.length} conflicts`);
  if (rows.length) failed = true;
}
console.log(
  "Historical timestamps require review: legacy fields had no timezone. Migration assumes UTC; see docs/OPERATIONS.md.",
);
await client.end();
if (failed) process.exitCode = 1;
