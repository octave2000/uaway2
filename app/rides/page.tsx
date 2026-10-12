import Link from "next/link";
import { RideShell } from "@/components/rides/ride-shell";
import { RideSearch } from "@/components/rides/search";
import { RideCard } from "@/components/rides/card";
import { searchRides } from "@/lib/domain/discovery";
import { DomainError } from "@/lib/domain/policy";
import { Notice } from "@/components/shared/notice";
export default async function Rides({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  let result;
  let error;
  try {
    result = await searchRides(params);
  } catch (e) {
    if (!(e instanceof DomainError)) throw e;
    error = e.message;
  }
  const pageLink = (page: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params))
      if (typeof v === "string") q.set(k, v);
    q.set("page", String(page));
    return `/rides?${q}`;
  };
  return (
    <RideShell>
      <h1 className="mb-2 text-3xl font-semibold">Find your next ride</h1>
      <p className="mb-7 text-muted-foreground">
        Scheduled journeys across Kenya. All times are East Africa Time.
      </p>
      <RideSearch params={params} />
      <div className="mt-6">
        <Notice error={error} />
      </div>
      <div className="mt-7 grid gap-4 md:grid-cols-2">
        {result?.rows.map((r) => (
          <RideCard key={r.journey.id} ride={r} />
        ))}
      </div>
      {result && !result.rows.length && (
        <p className="rounded-xl border p-10 text-center text-muted-foreground">
          No matching rides. Try a different date or nearby city.
        </p>
      )}
      <nav aria-label="Search pages" className="mt-6 flex justify-between">
        {result && result.page > 1 ? (
          <Link href={pageLink(result.page - 1)}>← Previous</Link>
        ) : (
          <span />
        )}
        {result?.hasNext && (
          <Link href={pageLink(result.page + 1)}>Next →</Link>
        )}
      </nav>
    </RideShell>
  );
}
