import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, CarFront } from "lucide-react";
import Link from "next/link";
import { signOutUser } from "@/app/(auth)/actions";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const [user] = await db.select().from(users).where(eq(users.email, session.user.email));

  if (!user) redirect("/login");

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-3xl mx-auto">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Profile & Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your account details and verification.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details.</CardDescription>
            </div>
            {user.verified ? (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700 flex items-center gap-1 w-fit">
                <CheckCircle2 className="w-3 h-3" /> Verified Account
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1 text-orange-600 bg-orange-100 dark:bg-orange-900/30 w-fit shrink-0">
                <AlertCircle className="w-3 h-3" /> Unverified
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue={user.name || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue={user.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" defaultValue={user.phone || ""} placeholder="+254..." />
            </div>
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ID Verification</CardTitle>
          <CardDescription>Upload your ID and a selfie to get verified for booking and driving.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>ID Document Photo</Label>
              <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
                 <span className="text-sm font-medium text-muted-foreground">Click to upload ID</span>
                 <input type="file" className="hidden" accept="image/*" />
              </label>
            </div>
            <div className="space-y-2">
              <Label>Selfie Photo</Label>
              <label className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors">
                 <span className="text-sm font-medium text-muted-foreground">Click to upload Selfie</span>
                 <input type="file" className="hidden" accept="image/*" />
              </label>
            </div>
          </div>
          <Button variant="secondary" className="w-full">Submit Verification</Button>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CarFront className="w-5 h-5 text-primary" />
            My Vehicles
          </CardTitle>
          <CardDescription>Manage your cars to start posting journeys.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="default" className="w-full font-semibold">
            <Link href="/dashboard/cars">Manage Vehicles</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="pt-4 border-t">
        <form action={signOutUser}>
          <Button variant="destructive" className="w-full md:w-auto" type="submit">Sign Out</Button>
        </form>
      </div>
    </div>
  );
}
