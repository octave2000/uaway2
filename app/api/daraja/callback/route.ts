import { NextResponse } from "next/server";

import { syncDarajaPaymentFromCallback } from "@/lib/payments/service";
import type { DarajaStkCallback } from "@/lib/payments/daraja";

type DarajaCallbackPayload = {
  Body?: {
    stkCallback?: DarajaStkCallback;
  };
};

export async function POST(request: Request) {
  const payload = (await request.json()) as DarajaCallbackPayload;
  const callback = payload.Body?.stkCallback;

  if (!callback?.CheckoutRequestID) {
    return NextResponse.json({ received: true });
  }

  await syncDarajaPaymentFromCallback(callback);
  return NextResponse.json({ received: true });
}
