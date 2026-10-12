import Link from "next/link";
import { PublicShell } from "@/components/rides/public-shell";
export default function Page() {
  return (
    <PublicShell>
      <article className="mx-auto max-w-2xl">
        <h1 className="page-title">Your privacy</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          How the Uaway pilot uses account and journey information.
        </p>
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Information used</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Uaway stores your contact details, identity verification
            submissions, vehicle details, bookings, payment references, and
            support requests to operate journeys and handle payments.
          </p>
        </section>
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Who can access it</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Your identity documents are private to you and authorized reviewers.
            Journey participants receive the contact and pickup information
            needed for their booking. Payment, email, and storage providers
            process the information needed to deliver those services.
          </p>
        </section>
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Account requests</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Contact support to request access, correction, or account
            deactivation. Payment and dispute records are preserved where needed
            to reconcile transactions and resolve outstanding issues.
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
