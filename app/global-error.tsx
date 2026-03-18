"use client";

import { PageError } from "@/components/feedback/page-error";

export default function GlobalError() {
  return (
    <html lang="en">
      <body>
        <PageError
          title="The app could not recover"
          description="A critical rendering error stopped this request before the normal route UI could load."
        />
      </body>
    </html>
  );
}
