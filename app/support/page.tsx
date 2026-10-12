import Link from "next/link";
import { PublicShell } from "@/components/rides/public-shell";
export default function Page() {
  return (
    <PublicShell>
      <article className="mx-auto max-w-2xl">
        <h1 className="page-title">Support</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Get help with a journey, payment, or account.
        </p>
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Booking or payment issue</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Open your booking and choose “Report a problem”. Include what
            happened and any payment reference. Never send your M-Pesa PIN or
            password.
          </p>
        </section>
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Track your request</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Sign in and open Support to see your request and the team’s
            response. Booking-related reports hold unsettled funds while they
            are reviewed.
          </p>
        </section>
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Urgent situations</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            If you are in immediate danger, contact local emergency services.
            The support inbox is not an emergency response service.
          </p>
        </section>
        <Link
          className="mt-8 inline-block text-primary"
          href="/dashboard/support"
        >
          Contact support →
        </Link>
      </article>
    </PublicShell>
  );
}
