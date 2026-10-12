import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { BrandLogo } from "@/components/shared/brand-logo";
import { registerWithPassword, signInWithGoogle } from "@/app/(auth)/actions";
import {
  getAuthErrorMessage,
  getSafeRedirectTarget,
  getSearchParam,
} from "@/app/(auth)/helpers";

type RegisterPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
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
    <main className="relative flex min-h-screen items-center justify-center px-4 py-20 bg-background overflow-hidden">
      <div className="w-full max-w-md relative z-10 flex flex-col gap-8">
        <BrandLogo className="size-24 self-center" />

        <Card className="rounded-2xl border bg-card shadow-sm overflow-hidden p-2 sm:p-4">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Create Account
            </CardTitle>
            <CardDescription className="font-medium">
              Join the UAWAY community today.
            </CardDescription>

            {errorMessage ? (
              <p className="mt-4 px-4 py-2 rounded-xl border border-destructive/20 bg-destructive/10 text-xs font-bold tracking-normal text-destructive">
                {errorMessage}
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-8">
            <form action={signInWithGoogle}>
              <input name="redirectTo" type="hidden" value={callbackUrl} />
              <SubmitButton
                className="h-12 w-full rounded-full border text-sm font-semibold transition-all hover:bg-muted/50"
                variant="outline"
                type="submit"
                pendingText="Connecting..."
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </SubmitButton>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-4 text-muted-foreground font-semibold tracking-widest">
                  Or register with
                </span>
              </div>
            </div>

            <form action={registerWithPassword} className="space-y-5">
              <input name="redirectTo" type="hidden" value={callbackUrl} />
              <div className="space-y-2">
                <Label
                  htmlFor="register-name"
                  className="text-xs font-semibold tracking-normal text-muted-foreground ml-1"
                >
                  Full Name
                </Label>
                <Input
                  id="register-name"
                  name="name"
                  placeholder="John Doe"
                  required
                  type="text"
                  className="h-12 rounded-xl border focus-visible:ring-primary/20 bg-muted/20"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="register-email"
                  className="text-xs font-semibold tracking-normal text-muted-foreground ml-1"
                >
                  Email Address
                </Label>
                <Input
                  id="register-email"
                  name="email"
                  placeholder="name@example.com"
                  required
                  type="email"
                  className="h-12 rounded-xl border focus-visible:ring-primary/20 bg-muted/20"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="register-password"
                  className="text-xs font-semibold tracking-normal text-muted-foreground ml-1"
                >
                  Create Password
                </Label>
                <Input
                  id="register-password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type="password"
                  className="h-12 rounded-xl border focus-visible:ring-primary/20 bg-muted/20"
                />
              </div>
              <SubmitButton
                className="mt-4 h-12 w-full rounded-full text-sm font-semibold"
                type="submit"
                pendingText="Creating account..."
              >
                Create Account
              </SubmitButton>
            </form>

            <p className="text-center text-sm font-medium text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={loginHref}
                className="text-primary font-semibold hover:underline underline-offset-4"
              >
                Login now
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground leading-relaxed px-10">
          By continuing, you agree to UAWAY&apos;s Terms of Service and Privacy
          Policy.
        </p>
      </div>
    </main>
  );
}
