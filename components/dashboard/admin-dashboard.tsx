import Link from "next/link";
import { ArrowRight, CarFront, CalendarCheck2, Route, ShieldCheck, Users, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AdminDashboardProps = {
  userName: string;
  stats: {
    totalUsers: number;
    activeJourneys: number;
    totalBookings: number;
    successfulPayments: number;
    pendingIdentityReviews: number;
    pendingVehicleReviews: number;
    pendingPayoutRequests: number;
  };
  pendingUsers: Array<{
    id: string;
    name: string | null;
    email: string;
  }>;
  pendingVehicles: Array<{
    id: string;
    name: string;
    plateNumber: string;
    driverName: string | null;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    status: string;
    passengerName: string | null;
    origin: string;
    destination: string;
  }>;
};

const quickLinks = [
  { href: "/dashboard/admin/users", label: "Users", description: "Review ID verification and account state.", icon: Users },
  { href: "/dashboard/admin/vehicles", label: "Vehicles", description: "Approve car verification documents and inspect fleet health.", icon: CarFront },
  { href: "/dashboard/admin/journeys", label: "Journeys", description: "Track route inventory, trip status, and route quality.", icon: Route },
  { href: "/dashboard/admin/bookings", label: "Bookings", description: "Monitor booking health, failures, and completion flow.", icon: CalendarCheck2 },
  { href: "/dashboard/admin/payments", label: "Payments", description: "Inspect transactions and manage payout requests.", icon: Wallet },
];

export function AdminDashboard({
  userName,
  stats,
  pendingUsers,
  pendingVehicles,
  recentPayments,
}: AdminDashboardProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-primary">
            Super Admin
          </p>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
            Platform control center
          </h1>
          <p className="max-w-2xl text-sm font-medium text-muted-foreground md:text-base">
            {userName.split(" ")[0]}, you can review verification, payouts, journeys, users, bookings, and payment health from one place.
          </p>
        </div>
        <Badge className="w-fit border-primary/20 bg-primary/10 px-4 py-2 text-primary">
          Full platform access
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <Users className="h-4 w-4 text-primary" />
              Users
            </div>
            <div className="text-4xl font-black text-foreground">{stats.totalUsers}</div>
            <div className="mt-2 text-sm font-medium text-muted-foreground">
              {stats.pendingIdentityReviews} waiting for ID review
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <Route className="h-4 w-4 text-primary" />
              Active journeys
            </div>
            <div className="text-4xl font-black text-foreground">{stats.activeJourneys}</div>
            <div className="mt-2 text-sm font-medium text-muted-foreground">
              {stats.totalBookings} total bookings on platform
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <Wallet className="h-4 w-4 text-primary" />
              Successful payments
            </div>
            <div className="text-4xl font-black text-foreground">{stats.successfulPayments} KES</div>
            <div className="mt-2 text-sm font-medium text-muted-foreground">
              {stats.pendingPayoutRequests} payout requests still pending
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Manual review
            </div>
            <div className="text-4xl font-black text-foreground">
              {stats.pendingIdentityReviews + stats.pendingVehicleReviews}
            </div>
            <div className="mt-2 text-sm font-medium text-muted-foreground">
              {stats.pendingVehicleReviews} vehicles and {stats.pendingIdentityReviews} users
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-black">Admin sections</CardTitle>
            <CardDescription className="font-medium">
              Move through the platform by domain and work each queue directly.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {quickLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-[1.5rem] border border-border/50 bg-background/70 p-5 transition-colors hover:border-primary/30 hover:bg-background"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-lg font-black text-foreground">{item.label}</div>
                  <div className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                    {item.description}
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-black">Identity review queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingUsers.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-border/60 bg-muted/10 p-6 text-sm font-medium text-muted-foreground">
                  No user verification reviews waiting.
                </div>
              ) : (
                pendingUsers.map((user) => (
                  <div key={user.id} className="rounded-[1.5rem] border border-border/50 bg-background/70 p-4">
                    <div className="font-bold text-foreground">{user.name || "Unnamed user"}</div>
                    <div className="text-sm font-medium text-muted-foreground">{user.email}</div>
                  </div>
                ))
              )}
              <Button asChild variant="outline" className="w-full rounded-2xl font-black uppercase tracking-[0.18em]">
                <Link href="/dashboard/admin/users">Open users queue</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-black">Vehicle review queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingVehicles.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-border/60 bg-muted/10 p-6 text-sm font-medium text-muted-foreground">
                  No vehicle verification reviews waiting.
                </div>
              ) : (
                pendingVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="rounded-[1.5rem] border border-border/50 bg-background/70 p-4">
                    <div className="font-bold text-foreground">{vehicle.name}</div>
                    <div className="text-sm font-medium text-muted-foreground">
                      {vehicle.plateNumber} • {vehicle.driverName || "Unknown driver"}
                    </div>
                  </div>
                ))
              )}
              <Button asChild variant="outline" className="w-full rounded-2xl font-black uppercase tracking-[0.18em]">
                <Link href="/dashboard/admin/vehicles">Open vehicles queue</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-[2rem] border-border/60 bg-card/90 shadow-sm">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl font-black">Recent payments</CardTitle>
            <CardDescription className="font-medium">
              Quick visibility into the latest transaction health.
            </CardDescription>
          </div>
          <Button asChild variant="outline" className="w-full rounded-2xl font-black uppercase tracking-[0.18em] md:w-auto">
            <Link href="/dashboard/admin/payments">View all payments</Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {recentPayments.map((payment) => (
            <div key={payment.id} className="rounded-[1.5rem] border border-border/50 bg-background/70 p-5">
              <div className="mb-3 flex items-center justify-between">
                <Badge
                  className={
                    payment.status === "success"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                      : payment.status === "failed"
                        ? "border-rose-500/20 bg-rose-500/10 text-rose-600"
                        : "border-amber-500/20 bg-amber-500/10 text-amber-600"
                  }
                >
                  {payment.status}
                </Badge>
                <div className="text-lg font-black text-foreground">{payment.amount} KES</div>
              </div>
              <div className="font-bold text-foreground">{payment.origin} to {payment.destination}</div>
              <div className="mt-2 text-sm font-medium text-muted-foreground">
                Passenger: {payment.passengerName || "Passenger"}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
