import Link from "next/link";
import { BrandLogo } from "@/components/shared/brand-logo";
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5"
          aria-label="Main navigation"
        >
          <BrandLogo className="size-16" />
          <div className="flex items-center gap-5 text-sm font-medium">
            <Link href="/rides">Find a ride</Link>
            <Link href="/dashboard/journeys/new" className="hidden sm:block">
              Offer a ride
            </Link>
            <Link href="/dashboard">My account</Link>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
      <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-5 border-t px-5 py-8 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <BrandLogo className="size-12" />
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
