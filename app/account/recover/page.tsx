import { z } from "zod";
import { PublicShell } from "@/components/rides/public-shell";
import { SubmitButton } from "@/components/ui/submit-button";
import { sendAccountLink } from "@/lib/auth/recovery";
import { redirect } from "next/navigation";
async function recover(data: FormData) {
  "use server";
  const email = z
    .string()
    .trim()
    .email()
    .transform((v) => v.toLowerCase())
    .parse(data.get("email"));
  await sendAccountLink(email, "reset");
  redirect("/account/recover?sent=1");
}
export default async function Recover({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;
  return (
    <PublicShell>
      <div className="mx-auto max-w-md">
        <h1 className="page-title">Reset your password</h1>
        {sent ? (
          <p className="mt-5" role="status">
            If an account exists, a reset link has been sent. Check your inbox.
          </p>
        ) : (
          <form action={recover} className="panel mt-5 space-y-4">
            <label className="field">
              Email
              <input
                className="control"
                type="email"
                name="email"
                autoComplete="email"
                required
              />
            </label>
            <SubmitButton>Send reset link</SubmitButton>
          </form>
        )}
      </div>
    </PublicShell>
  );
}
