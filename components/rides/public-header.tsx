"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, UserRound } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Explore" },
  { href: "/rides", label: "Find a ride" },
  { href: "/dashboard/journeys/new", label: "Offer a ride" },
  { href: "/support", label: "Help" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <header className="relative z-30 w-full bg-card px-4 py-4 sm:px-8 sm:py-5 lg:px-[4%]">
      <nav
        aria-label="Main navigation"
        className="flex items-center justify-between gap-2 lg:grid lg:grid-cols-[1fr_auto_1fr]"
      >
        <div className="flex items-center gap-3">
          <BrandLogo className="h-12 w-32 sm:h-16 sm:w-44" />
        </div>
        <div className="hidden items-center gap-1 rounded-full border border-border/70 bg-background/80 p-1.5 md:flex">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2.5 text-xs font-medium transition-colors lg:px-5 lg:text-sm",
                isActive(href)
                  ? "bg-card text-primary shadow-sm ring-1 ring-border/60"
                  : "text-muted-foreground hover:bg-card hover:text-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 lg:gap-5">
          <Link
            href="/dashboard"
            className="hidden min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground lg:inline-flex"
          >
            <UserRound className="size-4" /> My account
          </Link>
          <Link
            href="/rides"
            className="inline-flex min-h-11 items-center gap-3 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:px-5 sm:text-sm"
          >
            Find a ride <ArrowUpRight className="size-4" />
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open navigation"
                className="flex size-11 items-center justify-center rounded-full border bg-background transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring lg:hidden"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent className="gap-6">
              <SheetHeader className="border-b pb-6 pt-10">
                <SheetTitle className="text-3xl tracking-tight">
                  Going your way.
                </SheetTitle>
                <SheetDescription>
                  Find your next shared journey with Uaway.
                </SheetDescription>
              </SheetHeader>
              <nav
                aria-label="Mobile navigation"
                className="flex flex-col gap-2 px-4"
              >
                {[...links, { href: "/dashboard", label: "My account" }].map(
                  ({ href, label }) => (
                    <SheetClose asChild key={href}>
                      <Link
                        href={href}
                        aria-current={isActive(href) ? "page" : undefined}
                        className={cn(
                          "flex items-center justify-between rounded-xl px-4 py-4 text-base font-medium transition-colors hover:bg-accent",
                          isActive(href) && "bg-accent text-primary",
                        )}
                      >
                        {label}
                        <ArrowUpRight className="size-4" />
                      </Link>
                    </SheetClose>
                  ),
                )}
              </nav>
              <p className="mt-auto px-8 pb-8 text-xs text-muted-foreground">
                Good company. Better journeys.
              </p>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
