import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car } from "lucide-react";
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
    <main className="relative flex min-h-screen items-center justify-center px-4 py-20 bg-background overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -left-[10%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none" />
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col gap-8">
        <Link href="/" className="flex items-center gap-2 self-center group">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            <Car className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tighter uppercase">UAWAY</span>
        </Link>

        <Card className="rounded-[2.5rem] border-2 shadow-2xl shadow-primary/5 bg-background/80 backdrop-blur-xl overflow-hidden p-4">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-black tracking-tight">Create Account</CardTitle>
            <CardDescription className="font-medium">Join the UAWAY community today.</CardDescription>
            
            {errorMessage ? (
              <p className="mt-4 px-4 py-2 rounded-xl border border-destructive/20 bg-destructive/10 text-xs font-bold uppercase tracking-wider text-destructive">
                {errorMessage}
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-8">
            <form action={signInWithGoogle}>
              <input name="redirectTo" type="hidden" value={callbackUrl} />
              <Button className="w-full h-14 rounded-2xl text-base font-black border-2 hover:bg-muted/50 transition-all flex items-center gap-3" variant="outline" type="submit">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                   <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                   <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                   <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z" />
                   <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign up with Google
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-4 text-muted-foreground font-black tracking-widest">Or register with</span></div>
            </div>

            <form action={registerWithPassword} className="space-y-5">
              <input name="redirectTo" type="hidden" value={callbackUrl} />
              <div className="space-y-2">
                <Label htmlFor="register-name" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                <Input
                  id="register-name"
                  name="name"
                  placeholder="John Doe"
                  required
                  type="text"
                  className="h-14 rounded-2xl border-2 focus-visible:ring-primary/20 bg-muted/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                <Input
                  id="register-email"
                  name="email"
                  placeholder="name@example.com"
                  required
                  type="email"
                  className="h-14 rounded-2xl border-2 focus-visible:ring-primary/20 bg-muted/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Create Password</Label>
                <Input
                  id="register-password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type="password"
                  className="h-14 rounded-2xl border-2 focus-visible:ring-primary/20 bg-muted/20"
                />
              </div>
              <Button className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 mt-4" type="submit">
                Create Account
              </Button>
            </form>

            <p className="text-center text-sm font-medium text-muted-foreground">
              Already have an account?{" "}
              <Link href={loginHref} className="text-primary font-black hover:underline underline-offset-4">
                Login now
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] px-10">
          By continuing, you agree to UAWAY&apos;s Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
