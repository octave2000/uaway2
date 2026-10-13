import Link from "next/link";
import { PublicHeader } from "./public-header";
import { BrandLogo } from "@/components/shared/brand-logo";
export function PublicShell({
  children,
  hero,
}: {
  children: React.ReactNode;
  hero?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <PublicHeader />
      <main>
        {hero}
        <div className="mx-auto max-w-6xl px-5 py-10">{children}</div>
      </main>
      <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-5 border-t px-5 py-8 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <BrandLogo className="h-12 w-36" />
          <span>Share the journey.</span>
        </div>
        <div className="flex gap-5">
          <Link href="/support">Support</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </footer>
    </div>
  );
}
