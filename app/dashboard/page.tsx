import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { signOutUser } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1 text-sm">
            <p>{session.user.name ?? "Signed in"}</p>
            <p className="text-muted-foreground">{session.user.email}</p>
            <p className="break-all text-muted-foreground">{session.user.id}</p>
          </div>
          <Button asChild className="w-full" variant="outline">
            <Link href="/">Home</Link>
          </Button>
          <form action={signOutUser}>
            <Button className="w-full" type="submit">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
