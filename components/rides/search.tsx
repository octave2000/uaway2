import { PlacePicker } from "./place-picker";
import { Button } from "@/components/ui/button";
export function RideSearch({
  params = {},
}: {
  params?: Record<string, string | string[] | undefined>;
}) {
  const value = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string) : "";
  return (
    <form
      action="/rides"
      className="grid gap-4 rounded-2xl border bg-card p-5 shadow-sm md:grid-cols-[1fr_1fr_1fr_90px_auto] md:items-end"
    >
      {[
        ["origin", "From"],
        ["destination", "To"],
      ].map(([key, label]) => (
        <div key={key} className="grid gap-2 text-sm font-medium">
          {label}
          <PlacePicker
            name={key}
            label={label}
            defaultValue={value(key)}
            placeholder="Any town or place"
            className="h-12 min-w-0 rounded-lg border bg-background px-3 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      ))}
      <label className="grid gap-2 text-sm font-medium">
        Departure date
        <input
          type="date"
          name="date"
          defaultValue={value("date")}
          className="h-12 rounded-lg border bg-background px-3"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Seats
        <input
          type="number"
          name="seats"
          min="1"
          max="8"
          defaultValue={value("seats") || 1}
          className="h-12 w-full rounded-lg border bg-background px-3"
        />
      </label>
      <p className="text-xs text-muted-foreground md:col-span-4">
        Local trips like Nairobi to Kitengela are welcome, along with intercity
        rides. Search by the exact pickup and destination town or place.
      </p>
      <Button className="h-12">Find a ride</Button>
    </form>
  );
}
