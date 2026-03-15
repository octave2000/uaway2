import Link from "next/link";

import { auth } from "@/auth";
import { signOutUser } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Uaway Starter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {session?.user ? (
            <>
              <div className="space-y-1 text-sm">
                <p>{session.user.name ?? "Signed in"}</p>
                <p className="text-muted-foreground">{session.user.email}</p>
              </div>
              <Button asChild className="w-full">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <form action={signOutUser}>
                <Button className="w-full" type="submit" variant="outline">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild className="w-full">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
