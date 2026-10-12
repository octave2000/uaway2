import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
let pg: EmbeddedPostgres;
let database: typeof import("@/db");
let schema: typeof import("@/db/schema");
let reserve: typeof import("@/lib/domain/reservations").reserve;
let cancelBooking: typeof import("@/lib/domain/reservations").cancelBooking;
let sync: typeof import("@/lib/payments/service").syncDarajaPaymentFromQuery;
let rides: typeof import("@/lib/domain/rides");
let settlements: typeof import("@/lib/domain/settlements");
beforeAll(async () => {
  if (process.env.TEST_DATABASE_URL) {
    if (!new URL(process.env.TEST_DATABASE_URL).pathname.includes("test"))
      throw new Error("TEST_DATABASE_URL must name a test database");
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  } else {
    pg = new EmbeddedPostgres({
      databaseDir: await mkdtemp(join(tmpdir(), "uaway-test-")),
      port: 15439,
      user: "postgres",
      password: "test",
      persistent: false,
      onLog: () => {},
      onError: console.error,
      postgresFlags: ["-k", "/tmp"],
    });
    await pg.initialise();
    await pg.start();
    await pg.createDatabase("uaway_test");
    process.env.DATABASE_URL =
      "postgres://postgres:test@localhost:15439/uaway_test";
  }
  database = await import("@/db");
  schema = await import("@/db/schema");
  await migrate(database.db, { migrationsFolder: "db/migrations" });
  ({ reserve, cancelBooking } = await import("@/lib/domain/reservations"));
  ({ syncDarajaPaymentFromQuery: sync } =
    await import("@/lib/payments/service"));
  rides = await import("@/lib/domain/rides");
  settlements = await import("@/lib/domain/settlements");
});
afterAll(async () => {
  if (database) await database.sql.end();
  if (pg) await pg.stop();
});
async function fixture(seats = 2) {
  const { db } = database;
  const { users, cars, journeys } = schema;
  const people = await db
    .insert(users)
    .values(
      ["driver", "one", "two"].map((name) => ({
        name,
        email: `${crypto.randomUUID()}@test.invalid`,
        emailVerified: new Date(),
        verified: true,
        defaultRole:
          name === "driver" ? ("driver" as const) : ("passenger" as const),
      })),
    )
    .returning();
  const [driver, one, two] = people;
  const [car] = await db
    .insert(cars)
    .values({
      driverId: driver.id,
      name: "Test car",
      plateNumber: crypto.randomUUID().slice(0, 8),
      seats: 4,
      luggageCapacity: 20,
      verified: true,
    })
    .returning();
  const [journey] = await db
    .insert(journeys)
    .values({
      driverId: driver.id,
      carId: car.id,
      origin: "Nairobi",
      destination: "Nakuru",
      departureTime: new Date(Date.now() + 15 * 60000),
      seatsAvailable: seats,
      luggageCapacity: 20,
      pricePerSeat: 500,
    })
    .returning();
  return {
    driver,
    one,
    two,
    journey,
    input: {
      journeyId: journey.id,
      seatsBooked: 1,
      luggageSpace: 2,
      paymentPhone: "0712345678",
      idempotencyKey: crypto.randomUUID(),
    },
  };
}
async function paymentFor(id: string) {
  const [p] = await database.db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.bookingId, id));
  return p;
}
async function preparePayment(id: string) {
  const p = await paymentFor(id);
  const checkout = crypto.randomUUID(),
    merchant = crypto.randomUUID();
  await database.db
    .update(schema.payments)
    .set({ providerTransactionId: checkout, checkoutUrl: merchant })
    .where(eq(schema.payments.id, p.id));
  return {
    CheckoutRequestID: checkout,
    MerchantRequestID: merchant,
    ResultCode: "0",
    ResultDesc: "Success",
    ResponseCode: "0",
    ResponseDescription: "Success",
  };
}
describe("real PostgreSQL booking invariants", () => {
  it("allows only one concurrent reservation for the last seat", async () => {
    const f = await fixture(1);
    const results = await Promise.allSettled([
      reserve(f.one.id, f.input),
      reserve(f.two.id, { ...f.input, idempotencyKey: crypto.randomUUID() }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const [j] = await database.db
      .select()
      .from(schema.journeys)
      .where(eq(schema.journeys.id, f.journey.id));
    expect(j.seatsAvailable).toBe(0);
    expect(j.luggageCapacity).toBe(18);
  });
  it("replays the same reservation without creating another charge", async () => {
    const f = await fixture();
    const ids = await Promise.all([
      reserve(f.one.id, f.input),
      reserve(f.one.id, f.input),
    ]);
    expect(ids[0]).toBe(ids[1]);
    const ps = await database.db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.bookingId, ids[0]));
    expect(ps).toHaveLength(1);
  });
  it("processes concurrent success exactly once and ignores a later failure", async () => {
    const f = await fixture();
    const id = await reserve(f.one.id, f.input);
    const q = await preparePayment(id);
    await Promise.all([sync(q), sync(q), sync(q)]);
    await sync({ ...q, ResultCode: "1032" });
    const [b] = await database.db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.id, id));
    expect(b.status).toBe("confirmed");
    const p = await paymentFor(id);
    expect(p.status).toBe("success");
    const entries = await database.db
      .select()
      .from(schema.ledgerEntries)
      .where(eq(schema.ledgerEntries.paymentId, p.id));
    expect(entries).toHaveLength(1);
    const [j] = await database.db
      .select()
      .from(schema.journeys)
      .where(eq(schema.journeys.id, f.journey.id));
    expect(j.seatsAvailable).toBe(1);
  });
  it("refunds a late success and releases capacity only once", async () => {
    const f = await fixture();
    const id = await reserve(f.one.id, f.input);
    const q = await preparePayment(id);
    await database.db
      .update(schema.bookings)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(schema.bookings.id, id));
    await Promise.all([
      cancelBooking(f.one.id, id, true),
      cancelBooking(f.one.id, id, true),
    ]);
    await sync(q);
    await sync(q);
    const p = await paymentFor(id);
    expect(
      await database.db
        .select()
        .from(schema.refunds)
        .where(eq(schema.refunds.paymentId, p.id)),
    ).toHaveLength(1);
    const [j] = await database.db
      .select()
      .from(schema.journeys)
      .where(eq(schema.journeys.id, f.journey.id));
    expect(j.seatsAvailable).toBe(2);
  });
  it("does not complete another passenger and settles only with independent review", async () => {
    const f = await fixture();
    const a = await reserve(f.one.id, f.input);
    const b = await reserve(f.two.id, {
      ...f.input,
      idempotencyKey: crypto.randomUUID(),
    });
    await sync(await preparePayment(a));
    await sync(await preparePayment(b));
    for (const id of [a, b]) {
      const [record] = await database.db
        .select()
        .from(schema.bookings)
        .where(eq(schema.bookings.id, id));
      await rides.board(f.driver.id, id, record.bookingCode);
    }
    await rides.changeJourney(f.driver.id, f.journey.id, "start");
    await rides.changeJourney(f.driver.id, f.journey.id, "end");
    await rides.completeBooking(f.one.id, a);
    const [other] = await database.db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.id, b));
    expect(other.status).toBe("confirmed");
    const p = await paymentFor(a);
    await expect(
      settlements.requestPayout(f.driver.id, p.id),
    ).rejects.toThrow();
    await database.db
      .update(schema.bookings)
      .set({ completedAt: new Date(Date.now() - 7 * 3600000) })
      .where(eq(schema.bookings.id, a));
    await Promise.all([
      settlements.requestPayout(f.driver.id, p.id),
      settlements.requestPayout(f.driver.id, p.id),
    ]);
    const requests = await database.db
      .select()
      .from(schema.payoutRequests)
      .where(eq(schema.payoutRequests.paymentId, p.id));
    expect(requests).toHaveLength(1);
    await settlements.recordSettlement(
      "admin-one",
      "payout",
      requests[0].id,
      "MPESA-TEST-123",
    );
    await expect(
      settlements.reconcileSettlement("admin-one", "payout", requests[0].id),
    ).rejects.toThrow();
    await settlements.reconcileSettlement(
      "admin-two",
      "payout",
      requests[0].id,
    );
    await settlements.reconcileSettlement(
      "admin-two",
      "payout",
      requests[0].id,
    );
    const [paid] = await database.db
      .select()
      .from(schema.payoutRequests)
      .where(eq(schema.payoutRequests.id, requests[0].id));
    expect(paid.status).toBe("paid");
  });
  it("rejects cross-user cancellation and unverified booking", async () => {
    const f = await fixture();
    const id = await reserve(f.one.id, f.input);
    await expect(cancelBooking(f.two.id, id)).rejects.toThrow();
    await database.db
      .update(schema.users)
      .set({ verified: false })
      .where(eq(schema.users.id, f.two.id));
    await expect(
      reserve(f.two.id, { ...f.input, idempotencyKey: crypto.randomUUID() }),
    ).rejects.toThrow();
  });
  it("freezes payouts on a support dispute", async () => {
    const f = await fixture();
    const id = await reserve(f.one.id, f.input);
    await sync(await preparePayment(id));
    await database.db
      .update(schema.bookings)
      .set({
        status: "completed",
        completedAt: new Date(Date.now() - 7 * 3600000),
      })
      .where(eq(schema.bookings.id, id));
    await rides.openSupport(f.one.id, {
      bookingId: id,
      subject: "Journey problem",
      message: "The driver did not take the agreed route.",
    });
    await expect(
      settlements.requestPayout(f.driver.id, (await paymentFor(id)).id),
    ).rejects.toThrow();
  });
});
