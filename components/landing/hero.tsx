import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check, MapPin } from "lucide-react";
import { JourneyScene } from "./journey-scene";

export function LandingHero() {
  return (
    <section className="landing-hero" aria-labelledby="hero-title">
      <div className="relative z-10 mx-auto max-w-3xl px-5 pt-10 text-center sm:pt-16">
        <p className="mb-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          <span className="size-1.5 rounded-full bg-primary" /> Good company.
          Better journeys.
        </p>
        <h1
          id="hero-title"
          className="text-[clamp(2.7rem,6.6vw,5.4rem)] font-medium leading-[1.04] tracking-[-0.065em]"
        >
          Going your way.
          <br />
          <span className="text-primary">Together.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
          Across town or across Kenya. Find a seat, share the journey, and make
          getting there the good part.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 sm:gap-7">
          <a
            href="#find-a-ride"
            className="hero-cta inline-flex min-h-14 items-center gap-6 rounded-full px-7 text-sm font-semibold"
          >
            Find your ride <ArrowDown className="size-4" />
          </a>
          <Link
            href="/dashboard/journeys/new"
            className="inline-flex min-h-12 items-center gap-2 text-sm font-medium"
          >
            Offer a ride <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
      <div className="hero-art relative mt-2 sm:-mt-3">
        <div className="hero-scene">
          <JourneyScene />
        </div>
        <div className="hero-trip-card absolute right-[8%] top-[12%] w-44 rounded-2xl border border-white bg-white/95 p-4 text-[#171c20] shadow-xl sm:right-[17%] sm:top-[14%] sm:w-52 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#75817d]">
            A little closer
          </p>
          <p className="mt-2 text-base font-semibold tracking-tight">
            Your next adventure.
          </p>
          <div className="my-4 flex items-center gap-2 text-xs text-[#56706b]">
            <MapPin className="size-4 text-[#0c4652]" /> Nairobi{" "}
            <span className="h-px flex-1 bg-[#d8e3dd]" /> Kitengela
          </div>
          <div className="hidden items-center gap-2 border-t border-[#edf0ed] pt-3 text-[11px] text-[#56706b] sm:flex">
            <span className="flex size-5 items-center justify-center rounded-full bg-[#e8f2df]">
              <Check className="size-3" />
            </span>{" "}
            More moments. Shared miles.
          </div>
        </div>
        <p className="absolute bottom-6 left-6 hidden text-[10px] font-medium uppercase tracking-[.2em] text-[#75817d] sm:block">
          Small trips. Big possibilities.
        </p>
      </div>
    </section>
  );
}
