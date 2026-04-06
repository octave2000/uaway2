"use client";

import * as React from "react";

import { SubmitButton } from "@/components/ui/submit-button";

type PaymentStatusButtonProps = {
  paymentId: string;
  className?: string;
  pendingText?: string;
  rateLimited?: boolean;
  children: React.ReactNode;
};

const COOLDOWN_MS = 60_000;

function getStorageKey(paymentId: string) {
  return `daraja:status-check:${paymentId}`;
}

function readCooldownUntil(paymentId: string): number {
  if (typeof window === "undefined") {
    return 0;
  }

  const raw = window.localStorage.getItem(getStorageKey(paymentId));
  if (!raw) {
    return 0;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function writeCooldownUntil(paymentId: string, value: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getStorageKey(paymentId), String(value));
}

export function PaymentStatusButton({
  paymentId,
  className,
  pendingText,
  rateLimited,
  children,
}: PaymentStatusButtonProps) {
  const [cooldownUntil, setCooldownUntil] = React.useState(0);
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const stored = readCooldownUntil(paymentId);
    const next = rateLimited ? Math.max(stored, Date.now() + COOLDOWN_MS) : stored;
    if (rateLimited && next !== stored) {
      writeCooldownUntil(paymentId, next);
    }
    setCooldownUntil(next);
  }, [paymentId, rateLimited]);

  React.useEffect(() => {
    if (!cooldownUntil) {
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  const remainingMs = Math.max(cooldownUntil - now, 0);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const isCoolingDown = remainingMs > 0;

  const label = isCoolingDown ? `Try again in ${remainingSeconds}s` : children;

  return (
    <SubmitButton
      type="submit"
      className={className}
      pendingText={pendingText}
      disabled={isCoolingDown}
      onClick={() => {
        const next = Date.now() + COOLDOWN_MS;
        writeCooldownUntil(paymentId, next);
        setCooldownUntil(next);
        setNow(Date.now());
      }}
    >
      {label}
    </SubmitButton>
  );
}
