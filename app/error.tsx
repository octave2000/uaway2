"use client";

import { PageError } from "@/components/feedback/page-error";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageError
      title="This page hit a problem"
      description="Something went wrong while loading this route. Try again, and if it keeps happening, check the latest server logs."
      onReset={reset}
    />
  );
}
