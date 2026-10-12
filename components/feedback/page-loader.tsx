import { Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";

type PageLoaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageLoader({ eyebrow, title, description }: PageLoaderProps) {
  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-background px-4 py-8">
      <div className="page-shell-enter flex w-full max-w-lg flex-col items-center gap-6 text-center">
        <BrandLogo className="size-16" />
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border/60 bg-card text-primary shadow-sm">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>

        <div className="space-y-3">
          <div className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">
            {eyebrow}
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
            {title}
          </h1>
          <p className="mx-auto max-w-md text-sm font-medium leading-6 text-muted-foreground md:text-base">
            {description}
          </p>
        </div>

        <div className="w-full rounded-[1.75rem] border border-border/60 bg-card/90 p-5 shadow-sm">
          <div className="space-y-3">
            <div className="loading-shimmer h-3 w-1/3 rounded-full" />
            <div className="loading-shimmer h-3 w-full rounded-full" />
            <div className="loading-shimmer h-3 w-5/6 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
