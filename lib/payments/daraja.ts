import { z } from "zod";

const darajaEnvSchema = z.object({
  DARAJA_CONSUMER_KEY: z.string().min(1, "DARAJA_CONSUMER_KEY is required."),
  DARAJA_CONSUMER_SECRET: z
    .string()
    .min(1, "DARAJA_CONSUMER_SECRET is required."),
  DARAJA_SHORTCODE: z.string().min(1, "DARAJA_SHORTCODE is required."),
  DARAJA_PASSKEY: z.string().min(1, "DARAJA_PASSKEY is required."),
  DARAJA_CALLBACK_URL: z
    .string()
    .url("DARAJA_CALLBACK_URL must be a valid URL."),
  DARAJA_BASE_URL: z.string().url().optional(),
});

const DEFAULT_DARAJA_BASE_URL = "https://sandbox.safaricom.co.ke";

export interface DarajaStkPushInput {
  amount: number;
  phoneNumber: string;
  accountReference: string;
  transactionDesc: string;
}

export interface DarajaStkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface DarajaStkQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

export interface DarajaStkCallback {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: {
    Item?: Array<{ Name: string; Value?: string | number }>;
  };
}

export class DarajaApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

function getDarajaEnv() {
  return darajaEnvSchema.parse(process.env);
}

function getDarajaBaseUrl() {
  const { DARAJA_BASE_URL } = getDarajaEnv();
  return DARAJA_BASE_URL ?? DEFAULT_DARAJA_BASE_URL;
}

function getDarajaTimestamp(date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Africa/Nairobi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })
    .format(date)
    .replace(/\D/g, "");
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

async function parseDarajaResponse<T>(
  response: Response,
): Promise<{ json?: T; text: string }> {
  const text = await response.text();
  if (!text) {
    return { text };
  }

  try {
    return { json: JSON.parse(text) as T, text };
  } catch {
    return { text };
  }
}

async function getDarajaAccessToken(): Promise<string> {
  const { DARAJA_CONSUMER_KEY, DARAJA_CONSUMER_SECRET } = getDarajaEnv();
  const credentials = Buffer.from(
    `${DARAJA_CONSUMER_KEY}:${DARAJA_CONSUMER_SECRET}`,
  ).toString("base64");
  const response = await fetch(
    `${getDarajaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    },
  );

  const { json: payload } = await parseDarajaResponse<{
    access_token?: string;
    errorMessage?: string;
  }>(response);

  if (!response.ok || !payload?.access_token) {
    console.error("Daraja access token error", {
      status: response.status,
      providerError: true,
    });
    throw new Error("Unable to fetch Daraja access token.");
  }

  return payload.access_token;
}

export async function createDarajaStkPush(
  input: DarajaStkPushInput,
): Promise<DarajaStkPushResponse> {
  const token = await getDarajaAccessToken();
  const { DARAJA_SHORTCODE, DARAJA_PASSKEY, DARAJA_CALLBACK_URL } =
    getDarajaEnv();
  const timestamp = getDarajaTimestamp();
  const password = Buffer.from(
    `${DARAJA_SHORTCODE}${DARAJA_PASSKEY}${timestamp}`,
  ).toString("base64");

  const response = await fetch(
    `${getDarajaBaseUrl()}/mpesa/stkpush/v1/processrequest`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: DARAJA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: input.amount,
        PartyA: input.phoneNumber,
        PartyB: DARAJA_SHORTCODE,
        PhoneNumber: input.phoneNumber,
        CallBackURL: DARAJA_CALLBACK_URL,
        AccountReference: input.accountReference,
        TransactionDesc: input.transactionDesc,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    },
  );

  const { json: payload, text } =
    await parseDarajaResponse<DarajaStkPushResponse>(response);

  if (!response.ok || !payload?.CheckoutRequestID) {
    console.error("Daraja STK push error", {
      status: response.status,
      providerError: true,
    });
    throw new DarajaApiError(
      payload?.ResponseDescription ?? "Daraja STK push failed.",
      response.status,
      payload ?? text,
    );
  }

  return payload;
}

export async function queryDarajaStkPush(
  checkoutRequestId: string,
): Promise<DarajaStkQueryResponse> {
  const token = await getDarajaAccessToken();
  const { DARAJA_SHORTCODE, DARAJA_PASSKEY } = getDarajaEnv();
  const timestamp = getDarajaTimestamp();
  const password = Buffer.from(
    `${DARAJA_SHORTCODE}${DARAJA_PASSKEY}${timestamp}`,
  ).toString("base64");

  const response = await fetch(
    `${getDarajaBaseUrl()}/mpesa/stkpushquery/v1/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: DARAJA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    },
  );

  const { json: payload, text } =
    await parseDarajaResponse<DarajaStkQueryResponse>(response);

  if (!response.ok || !payload?.CheckoutRequestID) {
    console.error("Daraja STK query error", {
      status: response.status,
      providerError: true,
    });
    throw new DarajaApiError(
      payload?.ResponseDescription ?? "Daraja STK query failed.",
      response.status,
      payload ?? text,
    );
  }

  return payload;
}

export function getDarajaCallbackMetadataValue(
  callback: DarajaStkCallback,
  name: string,
): string | number | undefined {
  const items = callback.CallbackMetadata?.Item ?? [];
  return items.find((item) => item.Name === name)?.Value;
}
