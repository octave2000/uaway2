"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Car,
  CarFront,
  Calendar,
  Bookmark,
  Search,
  Home,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const passengerNavItems = [
  { href: "/dashboard", label: "Home", icon: Home, exact: true },
  {
    href: "/dashboard/bookings",
    label: "Bookings",
    icon: Bookmark,
    exact: false,
  },
  {
    href: "/rides",
    label: "Find rides",
    icon: Search,
    exact: false,
  },
  { href: "/dashboard/profile", label: "Account", icon: User, exact: false },
];

const driverNavItems = [
  { href: "/dashboard", label: "Home", icon: Home, exact: true },
  { href: "/dashboard/journeys", label: "Journeys", icon: Car, exact: false },
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
  { href: "/dashboard", label: "Home", icon: Home, exact: true },
  { href: "/dashboard/admin/users", label: "Users", icon: Users, exact: false },
  {
    href: "/dashboard/admin/vehicles",
    label: "Cars",
    icon: CarFront,
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
  { href: "/dashboard/profile", label: "Profile", icon: User, exact: false },
];

export function BottomNav({
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
    <nav
      aria-label="Mobile navigation"
      className="flex justify-around items-center h-[72px] w-full px-2"
    >
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
              "relative flex flex-col items-center justify-center w-full h-full gap-1.5 transition-colors",
              isActive
                ? "text-primary before:absolute before:top-0 before:h-0.5 before:w-12 before:rounded-full before:bg-primary"
                : "text-muted-foreground hover:text-primary",
            )}
          >
            <Icon
              className="h-[22px] w-[22px]"
              strokeWidth={isActive ? 2 : 1.5}
              aria-hidden="true"
            />
            <span className="text-[11px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
