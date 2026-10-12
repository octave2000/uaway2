"use server";
import { requireRole } from "@/lib/auth/roles";
import { runAction } from "@/lib/domain/action";
import { requestPayout } from "@/lib/domain/settlements";
export async function requestStandardPayoutAction(data: FormData) {
  const { userId } = await requireRole("driver");
  await runAction("/dashboard/payments", () =>
    requestPayout(userId, String(data.get("paymentId"))),
  );
}
