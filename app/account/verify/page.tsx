import { z } from "zod";
import { PublicShell } from "@/components/rides/public-shell";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/shared/notice";
import { consumeAccountLink } from "@/lib/auth/recovery";
import { runAction } from "@/lib/domain/action";
async function verify(data: FormData) {
  "use server";
  await runAction("/account/verify?done=1", () =>
    consumeAccountLink(
      z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .parse(data.get("token")),
      "verify",
    ),
  );
}
export default async function Verify({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; done?: string; error?: string }>;
}) {
  const { token, done, error } = await searchParams;
  return (
    <PublicShell>
      <div className="mx-auto max-w-md">
        <h1 className="page-title">Verify your email</h1>
        <Notice error={error} />
        {done && !error ? (
          <p className="mt-5">
            Email verified.{" "}
            <a href="/dashboard/profile" className="text-primary">
              Continue to your profile
            </a>
            .
          </p>
        ) : token ? (
          <form action={verify} className="mt-5">
            <input type="hidden" name="token" value={token} />
            <SubmitButton>Verify my email</SubmitButton>
          </form>
        ) : (
          <a className="mt-5 block text-primary" href="/dashboard/profile">
            Request a new link from your profile
          </a>
        )}
      </div>
    </PublicShell>
  );
}
