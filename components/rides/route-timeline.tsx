import { ArrowDown, MapPin } from "lucide-react";
import { meetingPoint } from "@/lib/domain/locations";

export function RouteTimeline({
  origin,
  destination,
  pickup,
  dropoff,
}: {
  origin: string;
  destination: string;
  pickup?: string | null;
  dropoff?: string | null;
}) {
  return (
    <div className="route-timeline">
      <div className="route-stop">
        <span className="route-marker route-marker-pickup">
          <ArrowDown size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-medium leading-snug">{origin}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Pickup ·{" "}
            {pickup ||
              meetingPoint(origin)?.point ||
              "Coordinate the meeting point with your driver"}
          </p>
        </div>
      </div>
      <div className="route-stop">
        <span className="route-marker">
          <MapPin size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-medium leading-snug">{destination}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Destination ·{" "}
            {dropoff ||
              meetingPoint(destination)?.point ||
              "Coordinate the meeting point with your driver"}
          </p>
        </div>
      </div>
    </div>
  );
}
