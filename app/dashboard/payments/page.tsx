import { and, eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { payments, bookings, journeys, payoutRequests } from "@/db/schema";
import { requireRole } from "@/lib/auth/roles";
import { canSettle, formatKES } from "@/lib/domain/policy";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/shared/notice";
import { requestStandardPayoutAction } from "./actions";
export default async function Earnings({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { userId } = await requireRole("driver");
  const rows = await db
    .select({ p: payments, b: bookings, j: journeys, payout: payoutRequests })
    .from(payments)
    .innerJoin(bookings, eq(payments.bookingId, bookings.id))
    .innerJoin(journeys, eq(bookings.journeyId, journeys.id))
    .leftJoin(
      payoutRequests,
      and(
        eq(payoutRequests.paymentId, payments.id),
        eq(payoutRequests.type, "standard"),
      ),
    )
    .where(and(eq(journeys.driverId, userId), eq(payments.status, "success")))
    .orderBy(desc(payments.createdAt))
    .limit(100);
  const total = (predicate: (r: (typeof rows)[number]) => boolean) =>
    formatKES(
      rows.filter(predicate).reduce((sum, r) => sum + r.b.fareMinor, 0),
    );
  return (
    <div className="page-content">
      <h1 className="page-title">Earnings</h1>
      <p className="page-description">
        Funds become available six hours after each passenger confirms arrival.
        Disputed funds stay on hold.
      </p>
      <Notice error={(await searchParams).error} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Available", total((r) => canSettle(r.b) && !r.payout)],
          [
            "Pending",
            total(
              (r) =>
                !canSettle(r.b) &&
                !r.b.disputedAt &&
                r.payout?.status !== "paid",
            ),
          ],
          [
            "On hold",
            total((r) => !!r.b.disputedAt && r.payout?.status !== "paid"),
          ],
          ["Paid", total((r) => r.payout?.status === "paid")],
        ].map(([label, value]) => (
          <div className="panel" key={label}>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      {rows.map(({ p, b, j, payout }) => (
        <div className="panel" key={p.id}>
          <div className="flex justify-between">
            <h2 className="font-semibold">
              {j.origin} → {j.destination}
            </h2>
            <strong>{formatKES(b.fareMinor)}</strong>
          </div>
          <p className="my-3 text-sm text-muted-foreground">
            {payout?.status === "paid"
              ? `Paid · ${payout.externalReference}`
              : b.disputedAt
                ? "On hold — support review"
                : payout
                  ? "Payout awaiting processing"
                  : canSettle(b)
                    ? "Available for payout"
                    : "Awaiting completion and release window"}
          </p>
          {canSettle(b) && !payout && (
            <form action={requestStandardPayoutAction}>
              <input type="hidden" name="paymentId" value={p.id} />
              <SubmitButton>Request payout</SubmitButton>
            </form>
          )}
        </div>
      ))}
      {!rows.length && (
        <div className="empty-state">
          Your earnings will appear after your first paid booking.
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Showing the latest 100 successful payments.
      </p>
    </div>
  );
}
