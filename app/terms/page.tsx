import Link from "next/link";
import { PublicShell } from "@/components/rides/public-shell";
export default function Page() {
  return (
    <PublicShell>
      <article className="mx-auto max-w-2xl">
        <h1 className="page-title">Pilot booking terms</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          The rules shown before you book or publish.
        </p>
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Booking and payment</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            A reservation holds seats for up to ten minutes. A ride is confirmed
            only after payment verification. If payment is confirmed after the
            hold ends, it enters the full-refund queue.
          </p>
        </section>
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Cancellation and refunds</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Passengers may cancel before departure for a full refund. Driver
            cancellations also receive a full refund. After departure, support
            reviews refunds and no-shows. Refunds remain pending until the
            external transfer is reconciled.
          </p>
        </section>
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Journey and driver earnings</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Each passenger boards with a booking code and confirms their own
            arrival. Driver funds become eligible six hours after completion,
            provided no dispute is open. Driver payouts are processed and
            independently reconciled by operations.
          </p>
        </section>
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Identity and conduct</h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            Passengers and drivers need approved identity documents and a
            verified email. Drivers must use an approved vehicle. Report unsafe
            conduct or incorrect journey information through support.
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
