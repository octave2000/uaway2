import { CarFront, Loader2, Route, ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";

type PageLoaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageLoader({ eyebrow, title, description }: PageLoaderProps) {
  return (
    <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-float-slow absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="animate-float-slower absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-secondary/10 blur-[120px]" />
      </div>

      <div className="relative flex w-full max-w-4xl flex-col gap-6">
        <div className="page-shell-enter space-y-3 text-center">
          <div className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">
            {eyebrow}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
            {title}
          </h1>
          <p className="mx-auto max-w-2xl text-sm font-medium text-muted-foreground md:text-base">
            {description}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[CarFront, Route, ShieldCheck].map((Icon, index) => (
            <Card
              key={index}
              className="page-shell-enter rounded-[2rem] border border-border/60 bg-card/85 p-6 shadow-sm"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 p-3 text-primary">
                  <Icon className="h-full w-full" />
                </div>
                <Loader2 className="h-5 w-5 animate-spin text-primary/70" />
              </div>
              <div className="space-y-3">
                <div className="loading-shimmer h-4 w-2/3 rounded-full" />
                <div className="loading-shimmer h-3 w-full rounded-full" />
                <div className="loading-shimmer h-3 w-4/5 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
