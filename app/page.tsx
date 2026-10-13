import Link from "next/link";
import { PublicShell } from "@/components/rides/public-shell";
import { LandingHero } from "@/components/landing/hero";
import { RideSearch } from "@/components/rides/search";
import { RideCard } from "@/components/rides/card";
import { searchRides } from "@/lib/domain/discovery";
export const dynamic = "force-dynamic";
export default async function Home() {
  const { rows } = await searchRides({});
  return (
    <PublicShell hero={<LandingHero />}>
      <section
        id="find-a-ride"
        aria-labelledby="ride-search-title"
        className="relative z-10 scroll-mt-6 pb-10 pt-4"
      >
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h2
            id="ride-search-title"
            className="text-xl font-semibold tracking-tight"
          >
            Where are we heading?
          </h2>
          <p className="text-sm text-muted-foreground">
            Your next seat is a search away.
          </p>
        </div>
        <RideSearch />
      </section>
      <section className="py-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Leaving soon</h2>
          <Link href="/rides" className="text-sm font-medium text-primary">
            View all rides →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {rows.slice(0, 4).map((r) => (
            <RideCard key={r.journey.id} ride={r} />
          ))}
        </div>
        {!rows.length && (
          <div className="rounded-2xl border p-10 text-center">
            <h3 className="font-semibold">The next journey could be yours.</h3>
            <p className="mt-2 text-muted-foreground">
              No upcoming rides yet. Offer a ride and make room for good
              company.
            </p>
            <Link
              className="mt-5 inline-block font-medium text-primary"
              href="/dashboard/journeys/new"
            >
              Offer a ride →
            </Link>
          </div>
        )}
      </section>
      <section className="my-10 grid gap-8 rounded-2xl bg-muted/50 p-8 md:grid-cols-3">
        {[
          [
            "Know who you travel with",
            "Identity checks for passengers and drivers, with approved vehicles.",
          ],
          [
            "A clear price, upfront",
            "Choose seats and luggage before paying. No platform fee during our pilot.",
          ],
          [
            "Help along the way",
            "Your booking keeps pickup details, payment history, and support together.",
          ],
        ].map(([title, body]) => (
          <div key={title}>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {body}
            </p>
          </div>
        ))}
      </section>
    </PublicShell>
  );
}
