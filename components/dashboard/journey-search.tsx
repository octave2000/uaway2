"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Calendar, MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface JourneySearchProps {
  targetPath?: string;
}

export function JourneySearch({ targetPath }: JourneySearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const origin = searchParams.get("origin") ?? "";
  const destination = searchParams.get("destination") ?? "";
  const date = searchParams.get("date") ?? "";

  function buildSearchUrl(formData: FormData) {
    const params = new URLSearchParams();
    const nextOrigin = String(formData.get("origin") ?? "").trim();
    const nextDestination = String(formData.get("destination") ?? "").trim();
    const nextDate = String(formData.get("date") ?? "").trim();

    if (nextOrigin) {
      params.set("origin", nextOrigin);
    }

    if (nextDestination) {
      params.set("destination", nextDestination);
    }

    if (nextDate) {
      params.set("date", nextDate);
    }

    const nextPath = targetPath ?? pathname;
    return params.toString() ? `${nextPath}?${params.toString()}` : nextPath;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(buildSearchUrl(new FormData(event.currentTarget)));
  }

  function handlePopularDestination(city: string) {
    const formData = new FormData();
    formData.set("origin", origin);
    formData.set("destination", city);
    formData.set("date", date);
    router.push(buildSearchUrl(formData));
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full overflow-hidden rounded-[2.5rem] border border-white/20 bg-background/40 p-6 shadow-2xl backdrop-blur-2xl group md:p-10"
    >
      <div className="relative flex flex-col gap-8">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-[80px] transition-all duration-1000 group-hover:bg-primary/20" />

        <div className="relative z-10 flex flex-col gap-2">
          <h2 className="text-3xl font-black leading-none tracking-tight text-foreground md:text-5xl">
            Find your <span className="text-primary italic">next</span> ride.
          </h2>
          <p className="text-sm font-medium text-muted-foreground md:text-base">
            Search active journeys across Kenya by route and date.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-2">
          <div className="relative group/field">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/field:text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <Input
              name="origin"
              placeholder="From where?"
              defaultValue={origin}
              className="h-16 rounded-2xl border-none bg-muted/30 pl-12 pr-4 text-lg font-bold placeholder:font-medium focus-visible:ring-2 focus-visible:ring-primary/20 md:h-20 md:rounded-l-3xl md:rounded-r-none"
            />
          </div>

          <div className="relative group/field">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/field:text-primary">
              <ArrowRight className="h-5 w-5" />
            </div>
            <Input
              name="destination"
              placeholder="To where?"
              defaultValue={destination}
              className="h-16 rounded-2xl border-none bg-muted/30 pl-12 pr-4 text-lg font-bold placeholder:font-medium focus-visible:ring-2 focus-visible:ring-primary/20 md:h-20 md:rounded-none"
            />
          </div>

          <div className="relative group/field">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within/field:text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <Input
              name="date"
              type="date"
              defaultValue={date}
              className="h-16 rounded-2xl border-none bg-muted/30 pl-12 pr-4 text-lg font-bold focus-visible:ring-2 focus-visible:ring-primary/20 md:h-20 md:rounded-none"
            />
          </div>

          <Button className="h-16 rounded-2xl bg-primary text-xl font-black text-white shadow-xl shadow-primary/20 transition-all duration-500 gap-3 hover:bg-primary/90 md:h-20 md:rounded-r-3xl md:rounded-l-none">
            <Search className="h-6 w-6" />
            Search
          </Button>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <span className="mr-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Popular:
          </span>
          {["Nairobi", "Mombasa", "Kisumu", "Eldoret"].map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => handlePopularDestination(city)}
              className="rounded-full border border-border/50 bg-muted/50 px-4 py-2 text-xs font-bold transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-primary/10"
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
