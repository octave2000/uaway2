import EmbeddedPostgres from "embedded-postgres";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
const pg = new EmbeddedPostgres({
  databaseDir: await mkdtemp(join(tmpdir(), "uaway-browser-")),
  port: 15440,
  user: "postgres",
  password: "test",
  persistent: false,
  onLog: () => {},
  onError: console.error,
  postgresFlags: ["-k", "/tmp"],
});
await pg.initialise();
await pg.start();
await pg.createDatabase("uaway_browser_test");
process.env.DATABASE_URL =
  "postgres://postgres:test@localhost:15440/uaway_browser_test";
const { db, sql } = await import("@/db");
const { users, cars, journeys } = await import("@/db/schema");
await migrate(db, { migrationsFolder: "db/migrations" });
const [driver] = await db
  .insert(users)
  .values({
    name: "Amina Kamau",
    email: "driver@browser.test",
    verified: true,
    emailVerified: new Date(),
    defaultRole: "driver",
  })
  .returning();
const [car] = await db
  .insert(cars)
  .values({
    name: "Toyota Fielder",
    plateNumber: "KAA123A",
    driverId: driver.id,
    seats: 3,
    luggageCapacity: 20,
    verified: true,
  })
  .returning();
await db
  .insert(journeys)
  .values({
    driverId: driver.id,
    carId: car.id,
    origin: "Nairobi",
    destination: "Nakuru",
    departureTime: new Date(Date.now() + 86400000),
    seatsAvailable: 3,
    luggageCapacity: 20,
    pricePerSeat: 800,
    pickupInstructions: "Kencom, City Hall Way",
    dropoffInstructions: "Central post office",
  });
console.log("Isolated browser database ready on localhost:15440");
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    await sql.end();
    await pg.stop();
    process.exit(0);
  });
await new Promise(() => {});
