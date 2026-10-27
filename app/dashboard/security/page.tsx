import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireRole } from "@/lib/auth/roles";
import {
  newSecret,
  encryptSecret,
  decryptSecret,
  validTotp,
  setMfa,
} from "@/lib/auth/mfa";
import { limit } from "@/lib/domain/shared";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/shared/notice";
async function setup() {
  "use server";
  await requireRole("super_admin");
  await (
    await cookies()
  ).set("uaway-mfa-setup", encryptSecret(newSecret()), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/dashboard/security",
    maxAge: 600,
  });
  redirect("/dashboard/security");
}
async function verify(data: FormData) {
  "use server";
  const { userId } = await requireRole("super_admin");
  await limit(`mfa:${userId}`, 5, 300000);
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const secret =
    user.adminTotpSecret || (await cookies()).get("uaway-mfa-setup")?.value;
  if (!secret || !validTotp(decryptSecret(secret), String(data.get("code"))))
    redirect("/dashboard/security?error=Invalid+code");
  if (!user.adminTotpSecret)
    await db
      .update(users)
      .set({ adminTotpSecret: secret })
      .where(eq(users.id, userId));
  await setMfa(userId);
  (await cookies()).delete("uaway-mfa-setup");
  redirect("/dashboard");
}
export default async function Security({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { userId } = await requireRole("super_admin");
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const pending = (await cookies()).get("uaway-mfa-setup")?.value;
  const pendingSecret =
    !user.adminTotpSecret && pending ? decryptSecret(pending) : null;
  const qr = pendingSecret
    ? await QRCode.toString(
        `otpauth://totp/${encodeURIComponent(`Uaway:${user.email ?? userId}`)}?${new URLSearchParams(
          {
            secret: pendingSecret,
            issuer: "Uaway",
            algorithm: "SHA1",
            digits: "6",
            period: "30",
          },
        )}`,
        { type: "svg", margin: 1 },
      )
    : null;
  return (
    <div className="page-content">
      <h1 className="page-title">Administrator verification</h1>
      <p className="page-description">
        Use your authenticator app to unlock administrative tools for one hour.
      </p>
      <Notice error={(await searchParams).error} />
      {!user.adminTotpSecret && !pending ? (
        <form action={setup}>
          <SubmitButton>Set up authenticator</SubmitButton>
        </form>
      ) : (
        <div className="panel">
          {pendingSecret && qr && (
            <>
              <p>
                Scan this QR code with your authenticator app, then enter the
                six-digit code it shows.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/svg+xml;utf8,${encodeURIComponent(qr)}`}
                alt="Authenticator setup QR code"
                width={224}
                height={224}
                className="my-5 rounded-lg bg-white p-2"
              />
              <p className="text-sm text-muted-foreground">
                Can&apos;t scan? Add a time-based account named Uaway using this
                secret:
              </p>
              <code className="mt-2 mb-5 block break-all rounded-lg bg-muted p-4">
                {pendingSecret}
              </code>
            </>
          )}
          <form action={verify} className="space-y-4">
            <label className="field">
              Six-digit code
              <input
                className="control"
                name="code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                required
              />
            </label>
            <SubmitButton>Verify</SubmitButton>
          </form>
        </div>
      )}
    </div>
  );
}
