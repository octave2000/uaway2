import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  sendMagicLink,
  signInWithCredentials,
  signInWithGoogle,
} from "@/app/(auth)/actions";
import {
  getAuthErrorMessage,
  getAuthNotice,
  getSafeRedirectTarget,
  getSearchParam,
} from "@/app/(auth)/helpers";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const callbackUrl = getSafeRedirectTarget(getSearchParam(params.callbackUrl));
  const errorMessage = getAuthErrorMessage(getSearchParam(params.error));
  const noticeMessage = getAuthNotice(
    getSearchParam(params.provider),
    getSearchParam(params.type),
  );
  const registerHref =
    callbackUrl === "/dashboard"
      ? "/register"
      : `/register?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Sign in</CardTitle>
            <Button asChild variant="link" className="h-auto px-0">
              <Link href={registerHref}>Register</Link>
            </Button>
          </div>
          {noticeMessage ? (
            <p className="rounded-md border bg-muted px-3 py-2 text-sm">{noticeMessage}</p>
          ) : null}
          {errorMessage ? (
            <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6">
          <form action={signInWithGoogle}>
            <input name="redirectTo" type="hidden" value={callbackUrl} />
            <Button className="w-full" type="submit" variant="outline">
              Continue with Google
            </Button>
          </form>

          <div className="space-y-4">
            <div className="text-sm font-medium">Email and password</div>
            <form action={signInWithCredentials} className="space-y-4">
              <input name="redirectTo" type="hidden" value={callbackUrl} />
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  name="password"
                  placeholder="Password"
                  required
                  type="password"
                />
              </div>
              <Button className="w-full" type="submit">
                Sign in
              </Button>
            </form>
          </div>

          <div className="space-y-4">
            <div className="text-sm font-medium">Magic link</div>
            <form action={sendMagicLink} className="space-y-4">
              <input name="redirectTo" type="hidden" value={callbackUrl} />
              <div className="space-y-2">
                <Label htmlFor="magic-email">Email</Label>
                <Input
                  id="magic-email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  type="email"
                />
              </div>
              <Button className="w-full" type="submit" variant="secondary">
                Send magic link
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
