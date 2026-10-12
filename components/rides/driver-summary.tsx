import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShieldCheck, Star } from "lucide-react";

export function DriverSummary({
  name,
  image,
  car,
  plate,
  verified,
}: {
  name: string | null;
  image?: string | null;
  car: string;
  plate?: string;
  verified?: boolean | null;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-4">
      <Avatar className="size-11 shrink-0">
        <AvatarImage src={image ?? undefined} alt={name || "Driver"} />
        <AvatarFallback className="bg-accent text-primary">
          {(name || "Driver")
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{name || "Your driver"}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          {verified && <ShieldCheck size={13} aria-hidden="true" />}
          {verified ? "Verified driver" : "Driver"}
        </p>
      </div>
      <div className="max-w-[45%] text-right">
        <p className="text-xs leading-relaxed">{car}</p>
        {plate && <p className="mt-1 text-xs text-muted-foreground">{plate}</p>}
      </div>
    </div>
  );
}

export function RatingStars({ rating }: { rating: number }) {
  return (
    <span
      className="inline-flex gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={16}
          aria-hidden="true"
          className={
            n <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-border"
          }
        />
      ))}
    </span>
  );
}
