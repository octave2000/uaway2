import { createHash } from "node:crypto";
import { z } from "zod";
import { db } from "@/db";
import { providerEvents } from "@/db/schema";
const callbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      CheckoutRequestID: z.string().min(1).max(200),
      MerchantRequestID: z.string().min(1).max(200),
      ResultCode: z.number().int(),
      ResultDesc: z.string().max(1000),
      CallbackMetadata: z.unknown().optional(),
    }),
  }),
});
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 16384)
    return Response.json({ error: "Payload too large" }, { status: 413 });
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = callbackSchema.safeParse(json);
  if (!parsed.success)
    return Response.json({ error: "Invalid callback" }, { status: 400 });
  const callback = parsed.data.Body.stkCallback;
  // Callback is an untrusted hint. Worker uses authenticated STK queries to establish success.
  await db
    .insert(providerEvents)
    .values({
      id: createHash("sha256").update(JSON.stringify(callback)).digest("hex"),
      checkoutId: callback.CheckoutRequestID,
      payload: callback,
    })
    .onConflictDoNothing();
  return Response.json({ received: true });
}
