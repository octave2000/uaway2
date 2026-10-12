import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { formatDeparture, formatKES } from "@/lib/domain/policy";
import { RouteTimeline } from "./route-timeline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
export function RideCard({
  ride,
}: {
  ride: {
    journey: {
      id: string;
      origin: string;
      destination: string;
      departureTime: Date;
      pricePerSeat: number;
      seatsAvailable: number;
      luggageCapacity: number;
      pickupInstructions?: string | null;
      dropoffInstructions?: string | null;
    };
    car: { name: string; insuranceVerifiedAt?: Date | null; insuranceExpiry?: Date | null };
    driver: { name: string | null; image?: string | null; fallbackImage?: string | null };
  };
}) {
  const { journey: j, car, driver } = ride;
  return (
    <Link
      href={`/rides/${j.id}`}
      className="ride-surface block p-5 transition hover:border-primary/40"
    >
      <div className="mb-5 flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">
          {formatDeparture(j.departureTime)} · EAT
        </span>
        <span className="flex items-center gap-1 text-primary">
          <ShieldCheck size={14} />
          Verified
        </span>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
        <RouteTimeline
          origin={j.origin}
          destination={j.destination}
          pickup={j.pickupInstructions}
          dropoff={j.dropoffInstructions}
        />
        <div className="text-right">
          <p className="mb-1.5 text-xs text-muted-foreground">Per seat</p>
          <span className="fare-chip">{formatKES(j.pricePerSeat * 100)}</span>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-xs">
        <span className="flex items-center gap-2">
          <Avatar className="size-8"><AvatarImage src={driver.image ?? driver.fallbackImage ?? undefined} alt={driver.name ?? "Driver"} /><AvatarFallback>{(driver.name ?? "D").slice(0, 1)}</AvatarFallback></Avatar>
          <span>{driver.name} <span className="text-muted-foreground">· {car.name}</span></span>
        </span>
        <span className="text-muted-foreground">
          {j.seatsAvailable} seats · {j.luggageCapacity} kg
        </span>
      </div>
      {car.insuranceVerifiedAt && car.insuranceExpiry && car.insuranceExpiry > new Date() && <p className="mt-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">Insurance verified through {car.insuranceExpiry.toLocaleDateString("en-KE")}</p>}
    </Link>
  );
}
