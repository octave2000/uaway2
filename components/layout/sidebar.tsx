"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Car, CarFront, Calendar, Home, Route, User, Users, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"

const passengerNavItems = [
  { href: "/dashboard", label: "Home", icon: Home, exact: true },
  { href: "/dashboard/journeys", label: "Find Rides", icon: Car, exact: false },
  { href: "/dashboard/bookings", label: "My Bookings", icon: Calendar, exact: false },
  { href: "/dashboard/profile", label: "Profile", icon: User, exact: false },
];

const driverNavItems = [
  { href: "/dashboard", label: "Home", icon: Home, exact: true },
  { href: "/dashboard/journeys", label: "My Journeys", icon: Car, exact: false },
  { href: "/dashboard/cars", label: "Vehicles", icon: CarFront, exact: false },
  { href: "/dashboard/payments", label: "Payments", icon: Wallet, exact: false },
  { href: "/dashboard/profile", label: "Profile", icon: User, exact: false },
];

const adminNavItems = [
  { href: "/dashboard", label: "Overview", icon: Home, exact: true },
  { href: "/dashboard/admin/users", label: "Users", icon: Users, exact: false },
  { href: "/dashboard/admin/vehicles", label: "Vehicles", icon: CarFront, exact: false },
  { href: "/dashboard/admin/journeys", label: "Journeys", icon: Route, exact: false },
  { href: "/dashboard/admin/bookings", label: "Bookings", icon: Calendar, exact: false },
  { href: "/dashboard/admin/payments", label: "Payments", icon: Wallet, exact: false },
];

export function Sidebar({ role }: { role: "passenger" | "driver" | "super_admin" }) {
  const pathname = usePathname()
  const navItems =
    role === "driver"
      ? driverNavItems
      : role === "super_admin"
        ? adminNavItems
        : passengerNavItems;

  return (
    <div className="flex h-full flex-col border-r bg-background w-full">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="text-primary text-xl font-bold tracking-wider uppercase">Uaway</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                  isActive ? "bg-muted text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
