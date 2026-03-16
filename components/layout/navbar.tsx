"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard 
} from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Navbar({ session }: { session: any }) {
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) return null;

  return (
    <nav className={cn(
      "fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-7xl transition-all duration-500",
      isScrolled ? "top-2" : "top-4"
    )}>
      <div className={cn(
        "h-16 md:h-20 px-4 md:px-8 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-between transition-all duration-500",
        "bg-background/60 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl shadow-primary/5 dark:shadow-none"
      )}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-500 relative border border-white/20">
            <Image 
              src="/logo.jpg" 
              alt="UAWAY Logo" 
              fill 
              className="object-cover"
              priority
            />
          </div>
          <span className="text-xl md:text-2xl font-black tracking-tighter uppercase italic text-foreground hidden sm:block">UAWAY</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2 bg-muted/30 p-1.5 rounded-full border border-border/50">
          <Link href="/dashboard/journeys">
            <Button variant="ghost" size="sm" className="rounded-full px-5 font-black uppercase tracking-widest text-[10px]">
              Find Ride
            </Button>
          </Link>
          <Link href="/dashboard/journeys/new">
            <Button variant="ghost" size="sm" className="rounded-full px-5 font-black uppercase tracking-widest text-[10px]">
              Post Ride
            </Button>
          </Link>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Theme Toggle */}
          <ThemeToggle className="w-10 h-10 md:w-12 md:h-12" />

          {session?.user ? (
            <Link href="/dashboard">
              <Button className="rounded-full h-10 md:h-12 px-6 md:px-8 bg-foreground text-background hover:opacity-90 font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl transition-all duration-500 hover:scale-[1.05]">
                <LayoutDashboard className="w-4 h-4 mr-2 hidden md:block" />
                Dashboard
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" className="rounded-full font-black uppercase tracking-widest text-[10px] h-10 md:h-12 px-6">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="rounded-full h-10 md:h-12 px-6 md:px-8 bg-primary text-white hover:bg-primary/90 font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl shadow-primary/20 transition-all duration-500 hover:scale-[1.05]">
                  Join
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
