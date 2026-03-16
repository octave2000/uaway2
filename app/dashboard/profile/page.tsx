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
import { CheckCircle2, AlertCircle, CarFront, MapPin } from "lucide-react";
import Link from "next/link";
import { signOutUser } from "@/app/(auth)/actions";
import { updateProfileAction, submitVerificationAction } from "./actions";
import { cn } from "@/lib/utils";

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
        <form action={updateProfileAction}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" defaultValue={user.name || ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue={user.email} disabled className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" defaultValue={user.phone || ""} placeholder="+254..." />
              </div>
            </div>
            <Button type="submit" className="font-bold">Save Changes</Button>
          </CardContent>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your default experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-bold">Default Dashboard Mode</Label>
            <div className="grid grid-cols-2 gap-4">
              <form action={updateProfileAction} className="col-span-2 grid grid-cols-2 gap-4">
                <input type="hidden" name="name" defaultValue={user.name || ""} />
                <input type="hidden" name="phone" defaultValue={user.phone || ""} />
                
                <button 
                  name="defaultRole" 
                  value="passenger"
                  type="submit"
                  className={cn(
                    "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all",
                    user.defaultRole === "passenger" 
                      ? "border-primary bg-primary/5 shadow-sm" 
                      : "border-border/50 hover:border-primary/30"
                  )}
                >
                  <MapPin className={cn("w-6 h-6", user.defaultRole === "passenger" ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("font-bold", user.defaultRole === "passenger" ? "text-primary" : "text-muted-foreground")}>Passenger</span>
                  {user.defaultRole === "passenger" && <CheckCircle2 className="w-4 h-4 text-primary mt-1" />}
                </button>

                <button 
                  name="defaultRole" 
                  value="driver"
                  type="submit"
                  className={cn(
                    "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all",
                    user.defaultRole === "driver" 
                      ? "border-secondary bg-secondary/5 shadow-sm" 
                      : "border-border/50 hover:border-secondary/30"
                  )}
                >
                  <CarFront className={cn("w-6 h-6", user.defaultRole === "driver" ? "text-secondary" : "text-muted-foreground")} />
                  <span className={cn("font-bold", user.defaultRole === "driver" ? "text-secondary" : "text-muted-foreground")}>Driver</span>
                  {user.defaultRole === "driver" && <CheckCircle2 className="w-4 h-4 text-secondary mt-1" />}
                </button>
              </form>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">This role will be shown by default when you log in.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all pointer-events-none" />
        <CardHeader>
          <CardTitle>ID Verification</CardTitle>
          <CardDescription>Upload your ID and a selfie to get verified for booking and driving.</CardDescription>
        </CardHeader>
        <form action={submitVerificationAction}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 text-center group/id">
                <Label className="text-left block mb-2 font-black uppercase text-[10px] tracking-widest text-muted-foreground">ID Document Photo</Label>
                <label className="border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3 cursor-pointer hover:bg-primary/5 transition-all border-border/60 hover:border-primary/50 relative group-hover/id:scale-[1.02]">
                   <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary opacity-20 group-hover/id:opacity-100 transition-opacity" />
                   </div>
                   <span className="text-sm font-bold text-muted-foreground group-hover/id:text-primary transition-colors">Tap to select ID</span>
                   <input type="file" className="hidden" accept="image/*" />
                </label>
              </div>
              <div className="space-y-2 text-center group/selfie">
                <Label className="text-left block mb-2 font-black uppercase text-[10px] tracking-widest text-muted-foreground">Selfie Photo</Label>
                <label className="border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center gap-3 cursor-pointer hover:bg-primary/5 transition-all border-border/60 hover:border-primary/50 relative group-hover/selfie:scale-[1.02]">
                   <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary opacity-20 group-hover/selfie:opacity-100 transition-opacity" />
                   </div>
                   <span className="text-sm font-bold text-muted-foreground group-hover/selfie:text-primary transition-colors">Tap to select Selfie</span>
                   <input type="file" className="hidden" accept="image/*" />
                </label>
              </div>
            </div>
            <Button variant="secondary" className="w-full font-black uppercase tracking-widest py-6 rounded-2xl shadow-lg border-none">Submit for Verification</Button>
          </CardContent>
        </form>
      </Card>

      <Card className="bg-primary shadow-xl border-none relative overflow-hidden group">
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <CarFront className="w-6 h-6" />
            My Vehicles
          </CardTitle>
          <CardDescription className="text-white/70">Manage your cars to start posting journeys.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="secondary" className="w-full font-black uppercase tracking-widest py-6 rounded-xl bg-white text-primary hover:bg-white/90 border-none">
            <Link href="/dashboard/cars">Vehicle Fleet</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="pt-8 mb-12">
        <form action={signOutUser}>
          <Button variant="ghost" className="w-full font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border/40" type="submit">Sign Out of Account</Button>
        </form>
      </div>
    </div>
  );
}
