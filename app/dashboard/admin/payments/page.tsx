import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { refunds, payoutRequests, payments } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/auth/roles";
import { formatKES } from "@/lib/domain/policy";
import { Notice } from "@/components/shared/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { settlementAction } from "../actions";
export default async function Payments({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; q?: string }>;
}) {
  const { userId } = await requireSuperAdmin();
  const { error, q } = await searchParams;
  const [refundRows, payoutRows, unknown] = await Promise.all([
    db.select().from(refunds).orderBy(desc(refunds.createdAt)).limit(100),
    db
      .select()
      .from(payoutRequests)
      .orderBy(desc(payoutRequests.createdAt))
      .limit(100),
    db
      .select()
      .from(payments)
      .where(eq(payments.providerStatus, "initiation_unknown"))
      .limit(100),
  ]);
  const rows = [
    ...refundRows.map((r) => ({
      ...r,
      kind: "refund" as const,
      minor: r.amountMinor,
    })),
    ...payoutRows.map((r) => ({
      ...r,
      kind: "payout" as const,
      minor: r.amount * 100,
    })),
  ].filter(
    (r) =>
      !q ||
      [r.id, r.paymentId, r.externalReference].some((v) => v?.includes(q)),
  );
  return (
    <div className="page-content">
      <h1 className="page-title">Refunds and payouts</h1>
      <p className="page-description">
        Record an external transaction only after executing it. A different
        administrator must reconcile it against the merchant statement.
      </p>
      <Notice error={error} />
      <form>
        <label className="field">
          Find a transaction
          <input
            name="q"
            defaultValue={q}
            className="control"
            placeholder="Payment ID or transaction reference"
          />
        </label>
      </form>
      {unknown.length > 0 && (
        <div className="panel">
          <h2 className="font-semibold">Unknown payment outcomes</h2>
          <p className="my-3 text-sm">
            Check these against the merchant statement. Do not initiate another
            charge.
          </p>
          {unknown.map((p) => (
            <p key={p.id} className="break-all text-sm">
              {p.id} · {p.phoneNumber} · {formatKES(p.amountMinor)}
            </p>
          ))}
        </div>
      )}
      {rows.map((r) => (
        <div className="panel" key={`${r.kind}:${r.id}`}>
          <div className="flex justify-between">
            <h2 className="font-semibold capitalize">
              {r.kind} · {r.status}
            </h2>
            <span>{formatKES(r.minor)}</span>
          </div>
          <p className="my-3 break-all text-xs text-muted-foreground">
            Payment {r.paymentId}
          </p>
          {r.reconciledBy ? (
            <p className="text-sm">Reconciled · {r.externalReference}</p>
          ) : (
            <form action={settlementAction} className="space-y-3">
              <input type="hidden" name="id" value={r.id} />
              <input type="hidden" name="kind" value={r.kind} />
              <input
                type="hidden"
                name="command"
                value={r.externalReference ? "reconcile" : "record"}
              />
              {r.externalReference ? (
                <p className="text-sm">
                  External reference: {r.externalReference}
                </p>
              ) : (
                <label className="field">
                  External transaction reference
                  <input
                    className="control"
                    name="reference"
                    required
                    minLength={6}
                  />
                </label>
              )}
              <SubmitButton disabled={r.recordedBy === userId}>
                {r.externalReference
                  ? "Confirm independent reconciliation"
                  : "Record completed external transfer"}
              </SubmitButton>
              {r.recordedBy === userId && (
                <p className="text-xs">
                  A second administrator must reconcile this transfer.
                </p>
              )}
            </form>
          )}
        </div>
      ))}
      {!rows.length && (
        <div className="empty-state">No matching settlements.</div>
      )}
    </div>
  );
}
