/* eslint-disable @next/next/no-html-link-for-pages -- A hard navigation must retry the network from the cached offline page. */
import { BrandLogo } from "@/components/shared/brand-logo";

export default function Offline() {
  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <BrandLogo className="mb-8 h-20 w-52" />
      <h1 className="page-title">You’re offline</h1>
      <p className="mt-5 leading-7 text-muted-foreground">
        Reconnect to check your ride, confirm payment, or make changes. Your
        booking is saved on Uaway. A payment is confirmed only when its verified
        status appears online.
      </p>
      <a
        href="/dashboard/bookings"
        className="mt-7 inline-block rounded-lg bg-primary px-5 py-3 text-primary-foreground"
      >
        Try my bookings again
      </a>
    </main>
  );
}
