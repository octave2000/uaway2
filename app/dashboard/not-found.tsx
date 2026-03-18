import Link from "next/link";
import { ArrowLeft, Search, LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DashboardNotFound() {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden px-4 py-10 md:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      <Card className="page-shell-enter relative flex w-full max-w-2xl flex-col gap-6 rounded-[2.5rem] border border-border/60 bg-card/90 p-8 shadow-xl md:p-10">
        <div className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">
          Dashboard route missing
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
            That dashboard page could not be found.
          </h1>
          <p className="text-sm font-medium leading-6 text-muted-foreground md:text-base">
            The page may have moved, the record may no longer exist, or the URL is incomplete.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button asChild className="rounded-2xl font-black uppercase tracking-[0.18em]">
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard home
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-2xl font-black uppercase tracking-[0.18em]">
            <Link href="/dashboard/journeys">
              <Search className="h-4 w-4" />
              Browse journeys
            </Link>
          </Button>
        </div>
        <Button asChild variant="ghost" className="w-fit rounded-2xl px-0 font-bold text-muted-foreground hover:bg-transparent">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </Card>
    </div>
  );
}
