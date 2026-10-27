import "dotenv/config";
import { PgBoss } from "pg-boss";
import { and, eq, isNull, lte, sql } from "drizzle-orm";
import { db, sql as connection } from "@/db";
import {
  bookings,
  journeys,
  outbox,
  supportCases,
  users,
  payments,
} from "@/db/schema";
import { cancelBooking } from "@/lib/domain/reservations";
import { reconcilePayments } from "@/lib/payments/service";
import { audit, notify } from "@/lib/domain/shared";
import { sendEmail } from "@/lib/email/mailer";
import { renderOutboxEmail } from "@/lib/email/outbox";

const boss = new PgBoss(process.env.DATABASE_URL!);
boss.on("error", (error) =>
  console.error(
    JSON.stringify({ event: "worker.error", message: error.message }),
  ),
);
await boss.start();
for (const name of ["maintenance", "payments", "email"]) {
  await boss.createQueue(name, {
    retryLimit: 5,
    retryDelay: 30,
    retryBackoff: true,
  });
  await boss.schedule(name, "* * * * *");
}
await boss.work("payments", async () => {
  await reconcilePayments();
});
await boss.work("maintenance", async () => {
  const expired = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.status, "payment_pending"),
        lte(bookings.expiresAt, new Date()),
      ),
    )
    .limit(100);
  for (const b of expired) await cancelBooking(b.clientId, b.id, true);
  // Mark unknown initiation after a crash; never repeat a potentially accepted charge.
  await db
    .update(payments)
    .set({ providerStatus: "initiation_unknown" })
    .where(
      and(
        eq(payments.providerStatus, "initiating"),
        lte(payments.createdAt, new Date(Date.now() - 15 * 60000)),
      ),
    );
  const stale = await db
    .select()
    .from(journeys)
    .where(
      and(
        eq(journeys.status, "ongoing"),
        lte(journeys.startedAt, new Date(Date.now() - 86400000)),
      ),
    )
    .limit(100);
  for (const journey of stale)
    await db.transaction(async (tx) => {
      const [locked] = await tx
        .select()
        .from(journeys)
        .where(eq(journeys.id, journey.id))
        .for("update");
      if (locked.status !== "ongoing") return;
      const [existing] = await tx
        .select()
        .from(supportCases)
        .where(eq(supportCases.subject, `Unresolved journey ${journey.id}`));
      if (!existing) {
        await tx
          .insert(supportCases)
          .values({
            userId: journey.driverId,
            subject: `Unresolved journey ${journey.id}`,
            message:
              "This journey has remained ongoing for 24 hours. Review each passenger before resolving. No automatic completion or payout.",
          });
        await audit(tx, null, "journey.exception", journey.id);
      }
    });
  const upcoming = await db
    .select({ booking: bookings, journey: journeys })
    .from(bookings)
    .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
    .where(
      and(
        eq(bookings.status, "confirmed"),
        eq(journeys.status, "active"),
        lte(journeys.departureTime, new Date(Date.now() + 3600000)),
        sql`${journeys.departureTime} > now()`,
      ),
    )
    .limit(200);
  for (const { booking, journey } of upcoming)
    await db.transaction((tx) =>
      notify(
        tx,
        `reminder:${booking.id}`,
        booking.clientId,
        "Your ride leaves soon",
        `${journey.origin} to ${journey.destination}. Check your meeting point and boarding code.`,
        `/dashboard/bookings/${booking.id}`,
      ),
    );
});
await boss.work("email", async () => {
  const rows = await db
    .select({ event: outbox, email: users.email, name: users.name })
    .from(outbox)
    .innerJoin(users, eq(outbox.userId, users.id))
    .where(isNull(outbox.sentAt))
    .orderBy(outbox.createdAt)
    .limit(25);
  for (const { event, email, name } of rows) {
    // In-app delivery is exactly once by outbox key. Email delivery is at least once.
    await sendEmail(email, await renderOutboxEmail(event, name));
    await db
      .update(outbox)
      .set({ sentAt: new Date() })
      .where(eq(outbox.id, event.id));
  }
});
console.log(JSON.stringify({ event: "worker.started" }));
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, async () => {
    await boss.stop();
    await connection.end();
    process.exit(0);
  });
