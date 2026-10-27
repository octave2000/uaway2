"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Car,
  MapPin,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
  Wallet,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { setUserRoleAction } from "@/app/dashboard/actions";
import { toast } from "sonner";
import { BrandLogo } from "@/components/shared/brand-logo";

export function OnboardingGate() {
  const [selected, setSelected] = useState<"passenger" | "driver" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await setUserRoleAction(selected);
      toast.success("Welcome aboard!", {
        description: `You are now set up as a ${selected}.`,
      });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const passengerFeatures = [
    { icon: MapPin, text: "Book seats in seconds" },
    { icon: ShieldCheck, text: "Travel with verified drivers" },
    { icon: Zap, text: "Real-time trip updates" },
  ];

  const driverFeatures = [
    { icon: Car, text: "Post journeys easily" },
    { icon: Wallet, text: "Earn money while driving" },
    { icon: Users, text: "Manage passenger requests" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-3xl animate-in fade-in duration-700">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pt-6 pb-24 px-4">
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6 md:gap-12">
          {/* Header Section */}
          <div className="flex flex-col items-center text-center gap-3">
            <BrandLogo className="h-20 w-52" />
            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
              Step 1: Setup Profile
            </div>
            <h1 className="text-3xl md:text-7xl font-black tracking-tighter text-foreground leading-none px-4">
              How will you use <span className="text-primary">UAWAY</span>?
            </h1>
            <p className="text-muted-foreground text-sm md:text-xl max-w-2xl font-medium leading-relaxed px-6">
              Pick your primary mode to get started. You can switch any time.
            </p>
          </div>

          {/* Role Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full max-w-4xl px-2">
            {/* Passenger Card */}
            <button
              type="button"
              aria-pressed={selected === "passenger"}
              disabled={isSubmitting}
              onClick={() => setSelected("passenger")}
              className={cn(
                "group relative flex flex-col items-start p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-2 transition-all duration-700 text-left overflow-hidden min-h-[180px] md:min-h-0",
                selected === "passenger"
                  ? "bg-primary border-primary shadow-xl shadow-primary/20 scale-[1.02] md:scale-[1.03]"
                  : "bg-muted/30 border-border/50 hover:border-primary/50 hover:bg-muted/50",
              )}
            >
              <div className="flex items-start justify-between w-full mb-4 md:mb-8">
                <div
                  className={cn(
                    "p-3 md:p-5 rounded-xl md:rounded-3xl transition-all duration-700",
                    selected === "passenger"
                      ? "bg-primary-foreground/10 rotate-12 scale-110"
                      : "bg-primary/10 group-hover:bg-primary/20",
                  )}
                >
                  <MapPin
                    className={cn(
                      "w-6 h-6 md:w-12 md:h-12 transition-colors",
                      selected === "passenger"
                        ? "text-primary-foreground"
                        : "text-primary",
                    )}
                  />
                </div>

                <div
                  className={cn(
                    "p-2 rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-700",
                    selected === "passenger"
                      ? "bg-primary-foreground text-primary"
                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                  )}
                >
                  {selected === "passenger" ? (
                    <Check className="w-5 h-5 md:w-8 md:h-8" />
                  ) : (
                    <ArrowRight className="w-5 h-5 md:w-8 md:h-8" />
                  )}
                </div>
              </div>

              <h3
                className={cn(
                  "text-2xl md:text-4xl font-black mb-1 md:mb-4 transition-colors tracking-tight",
                  selected === "passenger"
                    ? "text-primary-foreground"
                    : "text-foreground",
                )}
              >
                Passenger
              </h3>
              <p
                className={cn(
                  "text-xs md:text-lg font-medium leading-relaxed transition-colors mb-4 md:mb-8",
                  selected === "passenger"
                    ? "text-primary-foreground"
                    : "text-muted-foreground",
                )}
              >
                Looking for reliable, affordable rides.
              </p>

              <ul className="space-y-2 md:space-y-4 mb-2 md:mb-10 w-full">
                {passengerFeatures.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 md:gap-3">
                    <div
                      className={cn(
                        "w-4 h-4 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-colors",
                        selected === "passenger"
                          ? "bg-primary-foreground/10"
                          : "bg-primary/10",
                      )}
                    >
                      <f.icon
                        className={cn(
                          "w-2.5 h-2.5 md:w-3.5 md:h-3.5",
                          selected === "passenger"
                            ? "text-primary-foreground"
                            : "text-primary",
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] md:text-sm font-bold",
                        selected === "passenger"
                          ? "text-primary-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <div
                className={cn(
                  "absolute -bottom-12 -right-12 w-32 md:w-64 h-32 md:h-64 rounded-full blur-[40px] md:blur-[80px] transition-opacity duration-1000",
                  selected === "passenger"
                    ? "bg-white/10 opacity-100"
                    : "bg-primary/10 opacity-0 group-hover:opacity-100",
                )}
              />
            </button>

            {/* Driver Card */}
            <button
              type="button"
              aria-pressed={selected === "driver"}
              disabled={isSubmitting}
              onClick={() => setSelected("driver")}
              className={cn(
                "group relative flex flex-col items-start p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border-2 transition-all duration-700 text-left overflow-hidden min-h-[180px] md:min-h-0",
                selected === "driver"
                  ? "bg-secondary border-secondary-foreground/40 shadow-xl shadow-secondary-foreground/15 scale-[1.02] md:scale-[1.03]"
                  : "bg-muted/30 border-border/50 hover:border-secondary/50 hover:bg-muted/50",
              )}
            >
              <div className="flex items-start justify-between w-full mb-4 md:mb-8">
                <div
                  className={cn(
                    "p-3 md:p-5 rounded-xl md:rounded-3xl transition-all duration-700",
                    selected === "driver"
                      ? "bg-secondary-foreground/10 -rotate-12 scale-110"
                      : "bg-secondary/10 group-hover:bg-secondary/20",
                  )}
                >
                  <Car
                    className={cn(
                      "w-6 h-6 md:w-12 md:h-12 transition-colors",
                      "text-secondary-foreground",
                    )}
                  />
                </div>

                <div
                  className={cn(
                    "p-2 rounded-lg md:rounded-xl flex items-center justify-center transition-all duration-700",
                    selected === "driver"
                      ? "bg-secondary-foreground text-secondary"
                      : "bg-muted text-muted-foreground group-hover:bg-secondary/10 group-hover:text-secondary-foreground",
                  )}
                >
                  {selected === "driver" ? (
                    <Check className="w-5 h-5 md:w-8 md:h-8" />
                  ) : (
                    <ArrowRight className="w-5 h-5 md:w-8 md:h-8" />
                  )}
                </div>
              </div>

              <h3
                className={cn(
                  "text-2xl md:text-4xl font-black mb-1 md:mb-4 transition-colors tracking-tight",
                  selected === "driver"
                    ? "text-secondary-foreground"
                    : "text-foreground",
                )}
              >
                Driver
              </h3>
              <p
                className={cn(
                  "text-xs md:text-lg font-medium leading-relaxed transition-colors mb-4 md:mb-8",
                  selected === "driver"
                    ? "text-secondary-foreground"
                    : "text-muted-foreground",
                )}
              >
                Offset costs and help others.
              </p>

              <ul className="space-y-2 md:space-y-4 mb-2 md:mb-10 w-full">
                {driverFeatures.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 md:gap-3">
                    <div
                      className={cn(
                        "w-4 h-4 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-colors",
                        selected === "driver"
                          ? "bg-secondary-foreground/10"
                          : "bg-secondary/10",
                      )}
                    >
                      <f.icon
                        className={cn(
                          "w-2.5 h-2.5 md:w-3.5 md:h-3.5",
                          "text-secondary-foreground",
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[10px] md:text-sm font-bold",
                        selected === "driver"
                          ? "text-secondary-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <div
                className={cn(
                  "absolute -bottom-12 -right-12 w-32 md:w-64 h-32 md:h-64 rounded-full blur-[40px] md:blur-[80px] transition-opacity duration-1000",
                  selected === "driver"
                    ? "bg-white/10 opacity-100"
                    : "bg-secondary/10 opacity-0 group-hover:opacity-100",
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Footer for Button */}
      <div className="sticky bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-background via-background to-transparent pt-12">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleComplete}
            disabled={!selected || isSubmitting}
            size="lg"
            className={cn(
              "w-full h-14 md:h-20 rounded-[1.5rem] md:rounded-[2rem] text-lg md:text-2xl font-black transition-all duration-700 shadow-2xl",
              !selected && "opacity-50 grayscale",
              selected === "passenger" &&
                "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/30",
              selected === "driver" &&
                "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-secondary/30",
            )}
          >
            {isSubmitting ? "Finishing..." : "Go to Dashboard"}
          </Button>
        </div>
      </div>
    </div>
  );
}
