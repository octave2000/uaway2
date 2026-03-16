"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, MapPin, Check, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { setUserRoleAction } from "@/app/dashboard/actions";
import { toast } from "sonner";

export function OnboardingGate() {
  const [selected, setSelected] = useState<"passenger" | "driver" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await setUserRoleAction(selected);
      toast.success("Welcome aboard!", {
        description: `You are now set up as a ${selected}.`
      });
      // The reload happens because revalidatePath is used, but for a smoother experience 
      // we could just wait for the server component to re-render.
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="w-full max-w-4xl flex flex-col items-center gap-12">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-[0.2em]">
            Onboarding
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground">
            How will you use <span className="text-primary">UAWAY</span>?
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg font-medium">
            Choose your primary mode to personalize your experience. You can always switch later in your profile.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {/* Passenger Card */}
          <button
            onClick={() => setSelected("passenger")}
            className={cn(
              "group relative flex flex-col items-start p-8 rounded-[2.5rem] border-2 transition-all duration-500 text-left overflow-hidden",
              selected === "passenger" 
                ? "bg-primary border-primary shadow-[0_32px_64px_-16px_rgba(var(--primary-rgb),0.4)] scale-[1.02]" 
                : "bg-muted/30 border-border/50 hover:border-primary/50 hover:bg-muted/50"
            )}
          >
            <div className={cn(
              "p-4 rounded-3xl mb-8 transition-colors duration-500",
              selected === "passenger" ? "bg-white/20" : "bg-primary/10 group-hover:bg-primary/20"
            )}>
              <MapPin className={cn("w-10 h-10 transition-colors", selected === "passenger" ? "text-white" : "text-primary")} />
            </div>
            
            <h3 className={cn("text-3xl font-black mb-3 transition-colors", selected === "passenger" ? "text-white" : "text-foreground")}>
              I want to travel
            </h3>
            <p className={cn("text-lg font-medium leading-relaxed transition-colors", selected === "passenger" ? "text-white/80" : "text-muted-foreground")}>
              Find affordable rides, book seats, and travel comfortably across the city.
            </p>

            <div className={cn(
              "mt-8 p-3 rounded-2xl flex items-center justify-center transition-all duration-500",
              selected === "passenger" ? "bg-white text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
            )}>
              {selected === "passenger" ? <Check className="w-6 h-6" /> : <ArrowRight className="w-6 h-6" />}
            </div>

            {/* Decorative background circle */}
            <div className={cn(
              "absolute -bottom-12 -right-12 w-48 h-48 rounded-full blur-3xl transition-opacity duration-700",
              selected === "passenger" ? "bg-white/10 opacity-100" : "bg-primary/5 opacity-0 group-hover:opacity-100"
            )} />
          </button>

          {/* Driver Card */}
          <button
            onClick={() => setSelected("driver")}
            className={cn(
              "group relative flex flex-col items-start p-8 rounded-[2.5rem] border-2 transition-all duration-500 text-left overflow-hidden",
              selected === "driver" 
                ? "bg-secondary border-secondary shadow-[0_32px_64px_-16px_rgba(var(--secondary-rgb),0.3)] scale-[1.02]" 
                : "bg-muted/30 border-border/50 hover:border-secondary/50 hover:bg-muted/50"
            )}
          >
            <div className={cn(
              "p-4 rounded-3xl mb-8 transition-colors duration-500",
              selected === "driver" ? "bg-white/20" : "bg-secondary/10 group-hover:bg-secondary/20"
            )}>
              <Car className={cn("w-10 h-10 transition-colors", selected === "driver" ? "text-white" : "text-secondary")} />
            </div>
            
            <h3 className={cn("text-3xl font-black mb-3 transition-colors", selected === "driver" ? "text-white" : "text-foreground")}>
              I want to host
            </h3>
            <p className={cn("text-lg font-medium leading-relaxed transition-colors", selected === "driver" ? "text-white/80" : "text-muted-foreground")}>
              Share your car, post journeys, and earn money by carrying passengers.
            </p>

            <div className={cn(
              "mt-8 p-3 rounded-2xl flex items-center justify-center transition-all duration-500",
              selected === "driver" ? "bg-white text-secondary" : "bg-muted text-muted-foreground group-hover:bg-secondary/10 group-hover:text-secondary"
            )}>
              {selected === "driver" ? <Check className="w-6 h-6" /> : <ArrowRight className="w-6 h-6" />}
            </div>

             {/* Decorative background circle */}
             <div className={cn(
              "absolute -bottom-12 -right-12 w-48 h-48 rounded-full blur-3xl transition-opacity duration-700",
              selected === "driver" ? "bg-white/10 opacity-100" : "bg-secondary/5 opacity-0 group-hover:opacity-100"
            )} />
          </button>
        </div>

        <Button 
          onClick={handleComplete} 
          disabled={!selected || isSubmitting}
          size="lg"
          className={cn(
            "w-full max-w-sm h-16 rounded-2xl text-xl font-black transition-all duration-500 shadow-xl",
            !selected && "opacity-50 grayscale",
            selected === "passenger" && "bg-primary hover:bg-primary/90",
            selected === "driver" && "bg-secondary hover:bg-secondary/90"
          )}
        >
          {isSubmitting ? "Setting Up..." : "Continue to Dashboard"}
        </Button>
      </div>
    </div>
  );
}
