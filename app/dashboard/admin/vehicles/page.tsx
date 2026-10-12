import Link from "next/link";
import { desc, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { cars } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/auth/roles";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/shared/notice";
import { setCarInsuranceAction, setCarVerificationAction } from "../actions";
export default async function Vehicles({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; error?: string }>;
}) {
  await requireSuperAdmin();
  const { q, page: p, error } = await searchParams;
  const page = Math.max(1, Number(p) || 1);
  const rows = await db
    .select()
    .from(cars)
    .where(
      q
        ? or(ilike(cars.name, `%${q}%`), ilike(cars.plateNumber, `%${q}%`))
        : undefined,
    )
    .orderBy(desc(cars.createdAt))
    .limit(21)
    .offset((page - 1) * 20);
  return (
    <div className="page-content">
      <h1 className="page-title">Vehicle review</h1>
      <Notice error={error} />
      <form>
        <label className="field">
          Search name or registration
          <input name="q" className="control" defaultValue={q} />
        </label>
      </form>
      {rows.slice(0, 20).map((c) => (
        <div className="panel" key={c.id}>
          <h2 className="font-semibold">
            {c.name} · {c.plateNumber}
          </h2>
          <p className="my-3 text-sm">
            {c.verified ? "Approved" : "Awaiting approval"} · {c.seats}{" "}
            passenger seats
          </p>
          {c.documentPhoto?.startsWith("/api/files/") && (
            <a
              className="text-sm text-primary"
              href={c.documentPhoto}
              target="_blank"
              rel="noreferrer"
            >
              Review vehicle documents ↗
            </a>
          )}
          {!c.documentPhoto?.startsWith("/api/files/") && !c.verified && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
              No private vehicle document is available. You can still approve
              this vehicle with an explicit override and a review note.
            </p>
          )}
          <div className="my-4 rounded-xl border p-4 text-sm">
            <p className="font-medium">Insurance</p>
            <p className="mt-1 text-muted-foreground">
              {c.insuranceProvider || "Provider not entered"} · {c.insuranceExpiry ? `Expires ${c.insuranceExpiry.toLocaleDateString("en-KE")}` : "No expiry date"}
            </p>
            {c.insuranceDocument?.startsWith("/api/files/") ? (
              <a className="mt-2 inline-block text-primary" href={c.insuranceDocument} target="_blank" rel="noreferrer">Review insurance certificate ↗</a>
            ) : <p className="mt-1 text-amber-700">No private insurance certificate uploaded.</p>}
            <p className="mt-2">{c.insuranceVerifiedAt && c.insuranceExpiry && c.insuranceExpiry > new Date() ? "Verified and current" : "Not verified or expired"}</p>
            {c.insuranceVerificationNote && <p className="mt-1 text-muted-foreground">Review note: {c.insuranceVerificationNote}</p>}
            <form action={setCarInsuranceAction} className="mt-3 space-y-3">
              <input type="hidden" name="carId" value={c.id} />
              <label className="field">Insurance review note<input className="control" name="note" maxLength={1000} minLength={10} required /></label>
              <select className="control" name="nextState" defaultValue="false">
                <option value="true">Verify current certificate</option>
                <option value="false">Reject / revoke verification</option>
              </select>
              <SubmitButton>Save insurance review</SubmitButton>
            </form>
          </div>
          <form action={setCarVerificationAction} className="mt-4 space-y-3">
            <input type="hidden" name="carId" value={c.id} />
            <label className="field">
              Decision
              <select className="control" name="nextState">
                <option value="true">Approve</option>
                <option value="false">Reject / revoke</option>
              </select>
            </label>
            <label className="field">
              Review note
              <input
                className="control"
                name="note"
                maxLength={1000}
                required
                minLength={10}
              />
            </label>
            {!c.verified && !c.documentPhoto?.startsWith("/api/files/") && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-300 p-3 text-sm dark:border-amber-800">
                <input
                  className="mt-1 size-4 accent-primary"
                  type="checkbox"
                  name="bypassDocuments"
                  value="yes"
                />
                <span>
                  <span className="block font-medium">
                    Approve without uploaded documents
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Record why you approved it in the review note.
                  </span>
                </span>
              </label>
            )}
            <SubmitButton>Save decision</SubmitButton>
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
