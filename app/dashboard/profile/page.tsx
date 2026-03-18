import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { CheckCircle2, AlertCircle, CarFront, MapPin } from "lucide-react";
import { signOutUser } from "@/app/(auth)/actions";
import { FileUploadField } from "@/components/uploadthing/file-upload-field";
import { updateProfileAction, submitVerificationAction } from "./actions";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email));

  if (!user) redirect("/login");

  const verificationSubmitted = Boolean(user.idPhoto && user.selfiePhoto && !user.verified);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-3xl mx-auto">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Profile & Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your account details and verification.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details.</CardDescription>
            </div>
            {user.verified ? (
              <Badge
                variant="default"
                className="bg-green-600 hover:bg-green-700 flex items-center gap-1 w-fit"
              >
                <CheckCircle2 className="w-3 h-3" /> Verified Account
              </Badge>
            ) : verificationSubmitted ? (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 text-amber-700 bg-amber-100 dark:bg-amber-900/30 w-fit shrink-0"
              >
                <AlertCircle className="w-3 h-3" /> Under review
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 text-orange-600 bg-orange-100 dark:bg-orange-900/30 w-fit shrink-0"
              >
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
                <Input
                  id="email"
                  defaultValue={user.email}
                  disabled
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={user.phone || ""}
                  placeholder="+254..."
                />
              </div>
            </div>
            <SubmitButton type="submit" className="font-bold" pendingText="Saving...">
              Save Changes
            </SubmitButton>
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
              <form action={updateProfileAction} className="col-span-1">
                <input type="hidden" name="name" defaultValue={user.name || ""} />
                <input type="hidden" name="phone" defaultValue={user.phone || ""} />
                <SubmitButton
                  name="defaultRole"
                  value="passenger"
                  type="submit"
                  pendingText="Saving..."
                  className={cn(
                    "h-auto w-full flex-col gap-3 rounded-2xl border-2 px-6 py-6 transition-all",
                    user.defaultRole === "passenger"
                      ? "border-primary bg-primary/5 text-primary shadow-sm hover:bg-primary/5"
                      : "border-border/50 bg-background text-muted-foreground hover:border-primary/30 hover:bg-background",
                  )}
                >
                  <MapPin
                    className={cn(
                      "w-6 h-6",
                      user.defaultRole === "passenger"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "font-bold",
                      user.defaultRole === "passenger"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    Passenger
                  </span>
                  {user.defaultRole === "passenger" && (
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1" />
                  )}
                </SubmitButton>
              </form>

              <form action={updateProfileAction} className="col-span-1">
                <input type="hidden" name="name" defaultValue={user.name || ""} />
                <input type="hidden" name="phone" defaultValue={user.phone || ""} />
                <SubmitButton
                  name="defaultRole"
                  value="driver"
                  type="submit"
                  pendingText="Saving..."
                  className={cn(
                    "h-auto w-full flex-col gap-3 rounded-2xl border-2 px-6 py-6 transition-all",
                    user.defaultRole === "driver"
                      ? "border-secondary bg-secondary/5 text-secondary shadow-sm hover:bg-secondary/5"
                      : "border-border/50 bg-background text-muted-foreground hover:border-secondary/30 hover:bg-background",
                  )}
                >
                  <CarFront
                    className={cn(
                      "w-6 h-6",
                      user.defaultRole === "driver"
                        ? "text-secondary"
                        : "text-muted-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "font-bold",
                      user.defaultRole === "driver"
                        ? "text-secondary"
                        : "text-muted-foreground",
                    )}
                  >
                    Driver
                  </span>
                  {user.defaultRole === "driver" && (
                    <CheckCircle2 className="w-4 h-4 text-secondary mt-1" />
                  )}
                </SubmitButton>
              </form>
            </div>
          </div>
          <div className="space-y-3 pt-6 border-t border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-bold">Display Theme</Label>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Switch between light and dark mode.
                </p>
              </div>
              <ThemeToggle className="w-12 h-12" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all pointer-events-none" />
        <CardHeader>
          <CardTitle>ID Verification</CardTitle>
          <CardDescription>
            Upload your ID and a selfie, then submit them for manual review.
          </CardDescription>
        </CardHeader>
        <form action={submitVerificationAction}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUploadField
                accept="image/*,.pdf"
                acceptedLabel="JPG, PNG, or PDF up to 8MB"
                endpoint="identityDocument"
                helper="Upload the government ID or passport you want reviewed."
                kind="document"
                label="ID document"
                name="idPhotoUrl"
                value={user.idPhoto}
              />
              <FileUploadField
                accept="image/*"
                acceptedLabel="JPG, PNG, or WEBP up to 4MB"
                endpoint="selfiePhoto"
                helper="Upload a clear selfie that matches the identity document."
                label="Selfie photo"
                name="selfiePhotoUrl"
                value={user.selfiePhoto}
              />
            </div>
            <SubmitButton
              variant="secondary"
              className="w-full font-black uppercase tracking-widest py-6 rounded-2xl shadow-lg border-none"
              type="submit"
              pendingText={verificationSubmitted ? "Resubmitting..." : "Submitting..."}
            >
              {verificationSubmitted ? "Resubmit for Review" : "Submit for Verification"}
            </SubmitButton>
          </CardContent>
        </form>
      </Card>

      <div className="pt-8 mb-12">
        <form action={signOutUser}>
          <SubmitButton
            variant="ghost"
            className="w-full font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-border/40"
            type="submit"
            pendingText="Signing out..."
          >
            Sign Out of Account
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
