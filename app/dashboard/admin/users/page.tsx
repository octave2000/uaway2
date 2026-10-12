import Link from "next/link";
import { desc, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/auth/roles";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/shared/notice";
import { setUserVerificationAction, suspendUserAction } from "../actions";
export default async function Users({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; error?: string }>;
}) {
  await requireSuperAdmin();
  const { q, page: p, error } = await searchParams;
  const page = Math.max(1, Number(p) || 1);
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      verified: users.verified,
      idPhoto: users.idPhoto,
      selfiePhoto: users.selfiePhoto,
      suspended: users.suspended,
    })
    .from(users)
    .where(
      q
        ? or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`))
        : undefined,
    )
    .orderBy(desc(users.id))
    .limit(21)
    .offset((page - 1) * 20);
  return (
    <div className="page-content">
      <h1 className="page-title">People and verification</h1>
      <Notice error={error} />
      <form>
        <label className="field">
          Search people
          <input className="control" name="q" defaultValue={q} />
        </label>
      </form>
      {rows.slice(0, 20).map((u) => (
        <div className="panel" key={u.id}>
          <h2 className="font-semibold">
            {u.name} ·{" "}
            {u.suspended ? "Suspended" : u.verified ? "Verified" : "Unverified"}
          </h2>
          <p className="my-3 text-sm text-muted-foreground">{u.email}</p>
          <div className="mb-4 flex gap-4 text-sm text-primary">
            {u.idPhoto?.startsWith("/api/files/") && (
              <a target="_blank" rel="noreferrer" href={u.idPhoto}>
                Review ID ↗
              </a>
            )}
            {u.selfiePhoto?.startsWith("/api/files/") && (
              <a target="_blank" rel="noreferrer" href={u.selfiePhoto}>
                Review selfie ↗
              </a>
            )}
          </div>
          <form action={setUserVerificationAction} className="space-y-3">
            <input name="userId" type="hidden" value={u.id} />
            <input
              name="nextState"
              type="hidden"
              value={u.verified ? "false" : "true"}
            />
            <label className="field">
              Review note
              <input
                className="control"
                name="note"
                maxLength={1000}
                placeholder="Explain approval, rejection, or required changes"
                required
              />
            </label>
            <SubmitButton variant="outline">
              {u.verified ? "Revoke approval" : "Approve identity"}
            </SubmitButton>
          </form>
          <form action={setUserVerificationAction} className="mt-3">
            <input name="userId" type="hidden" value={u.id} />
            <input name="nextState" type="hidden" value="false" />
            <label className="field">
              Rejection reason
              <input className="control" name="note" required />
            </label>
            <SubmitButton variant="outline" className="mt-3">
              Request new documents
            </SubmitButton>
          </form>
          <form action={suspendUserAction} className="mt-4">
            <input name="userId" type="hidden" value={u.id} />
            <SubmitButton variant="outline">
              {u.suspended ? "Restore account" : "Suspend account"}
            </SubmitButton>
          </form>
        </div>
      ))}
      <nav className="flex justify-between">
        {page > 1 ? (
          <Link href={`?page=${page - 1}&q=${encodeURIComponent(q ?? "")}`}>
            ← Previous
          </Link>
        ) : (
          <span />
        )}
        {rows.length > 20 && (
          <Link href={`?page=${page + 1}&q=${encodeURIComponent(q ?? "")}`}>
            Next →
          </Link>
        )}
      </nav>
    </div>
  );
}
