import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  registerWithPassword,
  signInWithGoogle,
} from "@/app/(auth)/actions";
import {
  getAuthErrorMessage,
  getSafeRedirectTarget,
  getSearchParam,
} from "@/app/(auth)/helpers";

type RegisterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const session = await auth();

  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const callbackUrl = getSafeRedirectTarget(getSearchParam(params.callbackUrl));
  const errorMessage = getAuthErrorMessage(getSearchParam(params.error));
  const loginHref =
    callbackUrl === "/dashboard"
      ? "/login"
      : `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Register</CardTitle>
            <Button asChild variant="link" className="h-auto px-0">
              <Link href={loginHref}>Login</Link>
            </Button>
          </div>
          {errorMessage ? (
            <p className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <form action={signInWithGoogle}>
              <input name="redirectTo" type="hidden" value={callbackUrl} />
              <Button className="w-full" type="submit" variant="outline">
                Continue with Google
              </Button>
            </form>

            <div className="text-sm font-medium">Or create an account</div>

            <form action={registerWithPassword} className="space-y-4">
              <input name="redirectTo" type="hidden" value={callbackUrl} />
              <div className="space-y-2">
                <Label htmlFor="register-name">Name</Label>
                <Input
                  id="register-name"
                  name="name"
                  placeholder="Name"
                  required
                  type="text"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  name="password"
                  placeholder="Password"
                  required
                  type="password"
                />
              </div>
              <Button className="w-full" type="submit">
                Create account
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
