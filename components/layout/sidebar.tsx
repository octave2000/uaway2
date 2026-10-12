"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Car,
  CarFront,
  Calendar,
  Home,
  Route,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/shared/brand-logo";

const passengerNavItems = [
  { href: "/dashboard", label: "Home", icon: Home, exact: true },
  { href: "/rides", label: "Find Rides", icon: Car, exact: false },
  {
    href: "/dashboard/bookings",
    label: "My Bookings",
    icon: Calendar,
    exact: false,
  },
  { href: "/dashboard/profile", label: "Profile", icon: User, exact: false },
];

const driverNavItems = [
  { href: "/dashboard", label: "Home", icon: Home, exact: true },
  {
    href: "/dashboard/journeys",
    label: "My Journeys",
    icon: Car,
    exact: false,
  },
  { href: "/dashboard/cars", label: "Vehicles", icon: CarFront, exact: false },
  {
    href: "/dashboard/payments",
    label: "Payments",
    icon: Wallet,
    exact: false,
  },
  { href: "/dashboard/profile", label: "Profile", icon: User, exact: false },
];

const adminNavItems = [
  { href: "/dashboard", label: "Overview", icon: Home, exact: true },
  { href: "/dashboard/admin/users", label: "Users", icon: Users, exact: false },
  {
    href: "/dashboard/admin/vehicles",
    label: "Vehicles",
    icon: CarFront,
    exact: false,
  },
  {
    href: "/dashboard/admin/journeys",
    label: "Journeys",
    icon: Route,
    exact: false,
  },
  {
    href: "/dashboard/admin/bookings",
    label: "Bookings",
    icon: Calendar,
    exact: false,
  },
  {
    href: "/dashboard/admin/payments",
    label: "Payments",
    icon: Wallet,
    exact: false,
  },
  {
    href: "/dashboard/admin/support",
    label: "Support",
    icon: Users,
    exact: false,
  },
  { href: "/dashboard/profile", label: "Profile", icon: User, exact: false },
];

export function Sidebar({
  role,
}: {
  role: "passenger" | "driver" | "super_admin";
}) {
  const pathname = usePathname();
  const navItems =
    role === "driver"
      ? driverNavItems
      : role === "super_admin"
        ? adminNavItems
        : passengerNavItems;

  return (
    <div className="flex h-full flex-col bg-card w-full">
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <BrandLogo href="/dashboard" className="size-11" />
        <span className="text-primary text-2xl font-semibold tracking-tight">
          uaway.
        </span>
      </div>
      <div className="flex-1 overflow-auto py-6">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 transition-all hover:text-primary",
                  isActive ? "bg-accent text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
