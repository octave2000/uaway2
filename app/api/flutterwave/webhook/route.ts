import { NextResponse } from "next/server";

import { syncFlutterwavePayment } from "@/lib/payments/service";
import {
  verifyFlutterwaveTransaction,
  verifyFlutterwaveWebhookSignature,
} from "@/lib/payments/flutterwave";

interface FlutterwaveWebhookPayload {
  event?: string;
  data?: {
    id?: number;
  };
}

export async function POST(request: Request) {
  const rawPayload = await request.text();
  const signature =
    request.headers.get("flutterwave-signature") ??
    request.headers.get("verif-hash");

  if (!verifyFlutterwaveWebhookSignature(rawPayload, signature)) {
    return NextResponse.json({ message: "Invalid signature." }, { status: 401 });
  }

  const payload = JSON.parse(rawPayload) as FlutterwaveWebhookPayload;

  if (payload.event !== "charge.completed" || !payload.data?.id) {
    return NextResponse.json({ received: true });
  }

  const verification = await verifyFlutterwaveTransaction(payload.data.id);
  await syncFlutterwavePayment(verification);

  return NextResponse.json({ received: true });
}
