"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Car, Home, Calendar, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home, exact: true },
  { href: "/dashboard/journeys", label: "Journeys", icon: Car, exact: false },
  { href: "/dashboard/bookings", label: "Bookings", icon: Calendar, exact: false },
  { href: "/dashboard/profile", label: "Profile", icon: User, exact: false },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="flex justify-around items-center h-16 w-full px-2">
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
              "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all",
              isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] uppercase font-medium tracking-wide">
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
