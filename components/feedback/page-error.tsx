"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type PageErrorProps = {
  title: string;
  description: string;
  resetLabel?: string;
  onReset?: () => void;
};

export function PageError({
  title,
  description,
  resetLabel = "Try again",
  onReset,
}: PageErrorProps) {
  return (
    <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-destructive/10 blur-[120px]" />
      </div>

      <div className="page-shell-enter relative flex w-full max-w-2xl flex-col items-center gap-6 rounded-[2.5rem] border border-border/60 bg-card/90 px-8 py-12 text-center shadow-xl">
        <div className="rounded-[2rem] bg-destructive/10 p-4 text-destructive">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-foreground">{title}</h1>
          <p className="text-sm font-medium leading-6 text-muted-foreground md:text-base">
            {description}
          </p>
        </div>
        {onReset ? (
          <Button
            type="button"
            className="rounded-2xl px-6 text-sm font-black uppercase tracking-[0.18em]"
            onClick={onReset}
          >
            <RefreshCw className="h-4 w-4" />
            {resetLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
