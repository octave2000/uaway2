"use server";
import { requireAuthenticatedUser } from "@/lib/auth/roles";
import { runAction } from "@/lib/domain/action";
import { openSupport } from "@/lib/domain/rides";
export async function supportAction(data: FormData) {
  const { userId } = await requireAuthenticatedUser();
  await runAction("/dashboard/support", () =>
    openSupport(userId, {
      bookingId: data.get("bookingId") || undefined,
      subject: data.get("subject"),
      message: data.get("message"),
    }),
  );
}
