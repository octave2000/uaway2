import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { supportCases, users } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/auth/roles";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/shared/notice";
import { resolveCaseAction } from "../actions";
export default async function Support({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; error?: string }>;
}) {
  await requireSuperAdmin();
  const { q, error } = await searchParams;
  const rows = await db
    .select({ c: supportCases, email: users.email })
    .from(supportCases)
    .innerJoin(users, eq(supportCases.userId, users.id))
    .orderBy(desc(sql`CASE WHEN ${supportCases.subject} LIKE 'EMERGENCY%' AND ${supportCases.status} = 'open' THEN 1 ELSE 0 END`), desc(supportCases.createdAt))
    .limit(100);
  return (
    <div className="page-content">
      <h1 className="page-title">Support queue</h1>
      <Notice error={error} />
      <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">Emergency reports are prioritized here, but the queue does not dispatch live responders. Establish an on-call process before advertising monitored emergency support.</p>
      <form>
        <label className="field">
          Search latest cases
          <input className="control" name="q" defaultValue={q} />
        </label>
      </form>
      {rows
        .filter(
          ({ c, email }) =>
            !q ||
            `${c.subject} ${c.id} ${email}`
              .toLowerCase()
              .includes(q.toLowerCase()),
        )
        .map(({ c, email }) => (
          <div className="panel" key={c.id}>
            <h2 className="font-semibold">
              {c.subject.startsWith("EMERGENCY") ? "🚨 " : ""}{c.subject} · {c.status}
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              {email} · {c.bookingId}
            </p>
            <p className="my-4 whitespace-pre-wrap text-sm">{c.message}</p>
            {c.status === "open" ? (
              <form action={resolveCaseAction} className="space-y-4">
                <input type="hidden" name="id" value={c.id} />
                <label className="field">
                  Resolution
                  <textarea
                    className="control"
                    name="resolution"
                    required
                    minLength={10}
                  />
                </label>
                {c.bookingId && (
                  <label className="flex gap-2 text-sm">
                    <input type="checkbox" name="refund" value="yes" />
                    Queue a full refund
                  </label>
                )}
                <SubmitButton>Resolve case</SubmitButton>
              </form>
            ) : (
              <p className="text-sm">{c.resolution}</p>
            )}
          </div>
        ))}
    </div>
  );
}
