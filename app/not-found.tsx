import Link from "next/link";
import { Compass, Home, Route } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-float-slow absolute -right-24 top-12 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="animate-float-slower absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      <Card className="page-shell-enter relative flex w-full max-w-3xl flex-col gap-8 rounded-[2.75rem] border border-border/60 bg-card/90 p-8 shadow-xl md:p-12">
        <div className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.28em] text-primary">
          <Compass className="h-4 w-4" />
          Route not found
        </div>

        <div className="space-y-4">
          <h1 className="max-w-2xl text-4xl font-black tracking-tight text-foreground md:text-5xl">
            This page doesn&apos;t exist anymore.
          </h1>
          <p className="max-w-2xl text-sm font-medium leading-6 text-muted-foreground md:text-base">
            The link may be outdated, the ride may have been removed, or the address is incorrect. Use one of the routes below to get back into the app.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[1.75rem] border border-border/50 bg-background/70 p-5">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <Home className="h-4 w-4 text-primary" />
              Public site
            </div>
            <p className="mb-4 text-sm font-medium text-muted-foreground">
              Return to the homepage and search the latest active rides.
            </p>
            <Button asChild className="rounded-2xl font-black uppercase tracking-[0.18em]">
              <Link href="/">Go home</Link>
            </Button>
          </div>

          <div className="rounded-[1.75rem] border border-border/50 bg-background/70 p-5">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <Route className="h-4 w-4 text-primary" />
              Dashboard
            </div>
            <p className="mb-4 text-sm font-medium text-muted-foreground">
              Jump back into your dashboard and continue from current bookings or journeys.
            </p>
            <Button asChild variant="outline" className="rounded-2xl font-black uppercase tracking-[0.18em]">
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
}
