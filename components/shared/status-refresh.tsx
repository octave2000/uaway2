"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export function StatusRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    let ticks = 0;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
      if (++ticks >= 40) clearInterval(timer);
    }, 15000);
    return () => clearInterval(timer);
  }, [active, router]);
  return active ? (
    <p role="status" className="text-sm text-muted-foreground">
      Checking your payment automatically. You can safely return to this page.
    </p>
  ) : null;
}
