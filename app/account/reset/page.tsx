import { z } from "zod";
import { PublicShell } from "@/components/rides/public-shell";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/shared/notice";
import { consumeAccountLink } from "@/lib/auth/recovery";
import { runAction } from "@/lib/domain/action";
async function reset(data: FormData) {
  "use server";
  await runAction("/account/reset?done=1", () =>
    consumeAccountLink(
      z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .parse(data.get("token")),
      "reset",
      z.string().min(12).max(128).parse(data.get("password")),
    ),
  );
}
export default async function Reset({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; done?: string; error?: string }>;
}) {
  const { token, done, error } = await searchParams;
  return (
    <PublicShell>
      <div className="mx-auto max-w-md">
        <h1 className="page-title">Choose a new password</h1>
        <Notice error={error} />
        {done && !error ? (
          <p className="mt-5">
            Your password is updated.{" "}
            <a href="/login" className="text-primary">
              Sign in
            </a>{" "}
            again.
          </p>
        ) : token ? (
          <form action={reset} className="panel mt-5 space-y-4">
            <input type="hidden" name="token" value={token} />
            <label className="field">
              New password
              <input
                className="control"
                name="password"
                type="password"
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                required
              />
            </label>
            <SubmitButton>Update password</SubmitButton>
          </form>
        ) : (
          <a className="mt-5 block text-primary" href="/account/recover">
            Request a new reset link
          </a>
        )}
      </div>
    </PublicShell>
  );
}
