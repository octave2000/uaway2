import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

const flutterwaveEnvSchema = z.object({
  FLUTTERWAVE_SECRET_KEY: z.string().min(1, "FLUTTERWAVE_SECRET_KEY is required."),
  FLUTTERWAVE_WEBHOOK_SECRET: z.string().min(1).optional(),
  FLUTTERWAVE_SECRET_HASH: z.string().min(1).optional(),
});

const FLUTTERWAVE_API_BASE_URL = "https://api.flutterwave.com/v3";

export interface MpesaChargeInput {
  amount: number;
  email: string;
  fullname: string;
  phoneNumber: string;
  txRef: string;
  meta?: Record<string, string>;
}

export interface FlutterwaveChargeResponse {
  id: number;
  tx_ref: string;
  flw_ref: string;
  status: string;
  payment_type: string;
  processor_response: string;
}

export interface FlutterwaveVerificationResponse {
  id: number;
  tx_ref: string;
  flw_ref: string;
  status: string;
  currency: string;
  charged_amount: number;
  payment_type: string;
  processor_response: string;
  customer: {
    email: string;
    phone_number: string | null;
    name: string | null;
  };
}

function getFlutterwaveEnv() {
  return flutterwaveEnvSchema.parse(process.env);
}

async function flutterwaveRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { FLUTTERWAVE_SECRET_KEY } = getFlutterwaveEnv();
  const response = await fetch(`${FLUTTERWAVE_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    data?: T;
    message?: string;
  };

  if (!response.ok || !payload.data) {
    throw new Error(payload.message ?? "Flutterwave request failed.");
  }

  return payload.data;
}

export function normalizeMpesaPhoneNumber(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, "");

  if (digits.startsWith("254")) {
    return digits;
  }

  if (digits.startsWith("0")) {
    return `254${digits.slice(1)}`;
  }

  return digits;
}

export async function createMpesaCharge(input: MpesaChargeInput): Promise<FlutterwaveChargeResponse> {
  return flutterwaveRequest<FlutterwaveChargeResponse>("/charges?type=mpesa", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amount,
      currency: "KES",
      email: input.email,
      fullname: input.fullname,
      phone_number: normalizeMpesaPhoneNumber(input.phoneNumber),
      tx_ref: input.txRef,
      meta: input.meta,
    }),
  });
}

export async function verifyFlutterwaveTransaction(
  transactionId: string | number,
): Promise<FlutterwaveVerificationResponse> {
  return flutterwaveRequest<FlutterwaveVerificationResponse>(
    `/transactions/${transactionId}/verify`,
    {
      method: "GET",
    },
  );
}

export function verifyFlutterwaveWebhookSignature(
  payload: string,
  signature: string | null,
): boolean {
  if (!signature) {
    return false;
  }

  const { FLUTTERWAVE_WEBHOOK_SECRET, FLUTTERWAVE_SECRET_HASH } = getFlutterwaveEnv();

  if (FLUTTERWAVE_WEBHOOK_SECRET) {
    const expected = createHmac("sha256", FLUTTERWAVE_WEBHOOK_SECRET)
      .update(payload)
      .digest("hex");

    if (
      expected.length === signature.length &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
    ) {
      return true;
    }
  }

  if (FLUTTERWAVE_SECRET_HASH) {
    return FLUTTERWAVE_SECRET_HASH === signature;
  }

  return false;
}
