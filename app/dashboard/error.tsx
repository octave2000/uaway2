"use client";

import { PageError } from "@/components/feedback/page-error";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageError
      title="Dashboard data failed to load"
      description="We couldn’t finish loading the dashboard state for this route. Retry the page and the latest data will be requested again."
      onReset={reset}
    />
  );
}
