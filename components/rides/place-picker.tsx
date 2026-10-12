"use client";

import { Check, ChevronsUpDown, MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { kenyaPlaces, placeKey } from "@/lib/domain/locations";

export function PlacePicker({
  name,
  label,
  defaultValue = "",
  placeholder,
  required = false,
  className,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [query, setQuery] = useState("");
  const inputId = `place-${name}`;
  const searchPlaceholder = placeholder ?? "Search towns and places...";
  const matches = useMemo(() => {
    const needle = placeKey(query);
    return kenyaPlaces
      .filter(
        (place) =>
          !needle ||
          placeKey(place.name).includes(needle) ||
          placeKey(place.county).includes(needle),
      )
      .slice(0, 50);
  }, [query]);
  const hasExactMatch = matches.some(
    (place) => placeKey(place.name) === placeKey(query),
  );
  const customPlace = query.trim() && !hasExactMatch ? query.trim() : "";

  function choose(place: string) {
    setValue(place);
    setQuery("");
    setOpen(false);
  }

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setQuery("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            id={inputId}
            type="button"
            variant="outline"
            role="combobox"
            aria-label={label}
            aria-expanded={open}
            aria-required={required}
            className={cn(
              "h-11 w-full justify-between rounded-xl border-border bg-background px-3 text-left font-normal shadow-sm hover:bg-muted/40",
              !value && "text-muted-foreground",
              className,
            )}
          >
            <span className="truncate">{value || searchPlaceholder}</span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] min-w-72 overflow-hidden p-0"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById(`${inputId}-search`)?.focus();
          }}
        >
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              id={`${inputId}-search`}
              aria-label={`Search ${label.toLowerCase()}`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Kenya or enter any place"
              autoComplete="off"
              className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <ScrollArea className="max-h-64">
            <div className="p-1.5" role="listbox" aria-label={label}>
              {customPlace && (
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => choose(customPlace)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-primary outline-none hover:bg-accent focus:bg-accent"
                >
                  <MapPin className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">
                    Use “{customPlace}”
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Enter a custom pickup or destination
                    </span>
                  </span>
                </button>
              )}
              {matches.map((place) => (
                <button
                  key={`${place.name}-${place.county}`}
                  type="button"
                  role="option"
                  aria-selected={placeKey(value) === placeKey(place.name)}
                  onClick={() => choose(place.name)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm outline-none hover:bg-accent focus:bg-accent"
                >
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">
                    {place.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {place.county} County
                    </span>
                  </span>
                  {placeKey(value) === placeKey(place.name) && (
                    <Check className="size-4 shrink-0 text-primary" />
                  )}
                </button>
              ))}
              {!matches.length && !customPlace && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Type a place name to use it.
                </p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </>
  );
}
