import { desc } from "drizzle-orm";

import { setUserVerificationAction } from "@/app/dashboard/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isConfiguredSuperAdminEmail, requireSuperAdmin } from "@/lib/auth/roles";

export default async function AdminUsersPage() {
  await requireSuperAdmin();

  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      verified: users.verified,
      defaultRole: users.defaultRole,
      idPhoto: users.idPhoto,
      selfiePhoto: users.selfiePhoto,
    })
    .from(users)
    .orderBy(users.verified, desc(users.email));

  const pendingReviewCount = userRows.filter(
    (user) => !user.verified && user.idPhoto && user.selfiePhoto,
  ).length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-8">
      <div className="space-y-2">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">Admin users</p>
        <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
          Review identities and account state.
        </h1>
        <p className="max-w-3xl text-sm font-medium text-muted-foreground md:text-base">
          Approve manual identity checks, inspect uploaded documents, and keep track of platform roles.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm"><CardContent className="p-6"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total users</div><div className="mt-3 text-4xl font-black text-foreground">{userRows.length}</div></CardContent></Card>
        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm"><CardContent className="p-6"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Verified</div><div className="mt-3 text-4xl font-black text-foreground">{userRows.filter((user) => user.verified).length}</div></CardContent></Card>
        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm"><CardContent className="p-6"><div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Pending review</div><div className="mt-3 text-4xl font-black text-foreground">{pendingReviewCount}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {userRows.map((user) => {
          const resolvedRole = isConfiguredSuperAdminEmail(user.email)
            ? "super_admin"
            : user.defaultRole ?? "unset";
          const hasDocuments = Boolean(user.idPhoto && user.selfiePhoto);

          return (
            <Card key={user.id} className="rounded-[2rem] border border-border/60 bg-card/90 shadow-sm">
              <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="text-xl font-black">{user.name || "Unnamed user"}</CardTitle>
                  <CardDescription className="font-medium">{user.email}</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{resolvedRole.replace("_", " ")}</Badge>
                  <Badge
                    className={
                      user.verified
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                        : hasDocuments
                          ? "border-amber-500/20 bg-amber-500/10 text-amber-600"
                          : "border-border/60 bg-muted/20 text-foreground"
                    }
                  >
                    {user.verified ? "verified" : hasDocuments ? "awaiting review" : "unverified"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Phone</div>
                    <div className="mt-2 text-sm font-bold text-foreground">{user.phone || "Not provided"}</div>
                  </div>
                  <div className="rounded-[1.25rem] border border-border/40 bg-background/60 p-4">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Docs</div>
                    <div className="mt-2 text-sm font-bold text-foreground">{hasDocuments ? "Ready for review" : "Missing"}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {user.idPhoto ? (
                    <Button asChild variant="outline" className="rounded-2xl">
                      <a href={user.idPhoto} target="_blank" rel="noreferrer">Open ID</a>
                    </Button>
                  ) : null}
                  {user.selfiePhoto ? (
                    <Button asChild variant="outline" className="rounded-2xl">
                      <a href={user.selfiePhoto} target="_blank" rel="noreferrer">Open selfie</a>
                    </Button>
                  ) : null}
                </div>

                {hasDocuments || user.verified ? (
                  <form action={setUserVerificationAction} className="flex flex-col gap-3 sm:flex-row">
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="nextState" value={user.verified ? "false" : "true"} />
                    <SubmitButton className="rounded-2xl font-black uppercase tracking-[0.18em]" pendingText="Updating...">
                      {user.verified ? "Revoke verification" : "Approve verification"}
                    </SubmitButton>
                  </form>
                ) : (
                  <div className="rounded-[1.25rem] border border-dashed border-border/60 bg-muted/10 p-4 text-sm font-medium text-muted-foreground">
                    No verification documents uploaded yet.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
