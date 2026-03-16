"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Users, Search, ArrowRight } from "lucide-react";

export function JourneySearch() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");

  return (
    <div className="w-full bg-background/40 backdrop-blur-2xl border border-white/20 p-6 md:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
      {/* Decorative background flare */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-all duration-1000" />
      
      <div className="relative z-10 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground leading-none">
            Find your <span className="text-primary italic">next</span> ride.
          </h2>
          <p className="text-muted-foreground font-medium text-sm md:text-base">
            Search thousands of verified journeys across Kenya.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-2">
          {/* Origin */}
          <div className="relative group/field">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/field:text-primary transition-colors">
              <MapPin className="w-5 h-5" />
            </div>
            <Input 
              placeholder="From where?" 
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="h-16 md:h-20 pl-12 pr-4 bg-muted/30 border-none rounded-2xl md:rounded-l-3xl md:rounded-r-none text-lg font-bold placeholder:font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>

          {/* Destination */}
          <div className="relative group/field">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/field:text-primary transition-colors">
              <ArrowRight className="w-5 h-5" />
            </div>
            <Input 
              placeholder="To where?" 
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="h-16 md:h-20 pl-12 pr-4 bg-muted/30 border-none rounded-2xl md:rounded-none text-lg font-bold placeholder:font-medium transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>

          {/* Date */}
          <div className="relative group/field">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/field:text-primary transition-colors">
              <Calendar className="w-5 h-5" />
            </div>
            <Input 
              type="date"
              className="h-16 md:h-20 pl-12 pr-4 bg-muted/30 border-none rounded-2xl md:rounded-none text-lg font-bold transition-all focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </div>

          {/* Search Button */}
          <Button className="h-16 md:h-20 bg-primary hover:bg-primary/90 text-white font-black text-xl rounded-2xl md:rounded-r-3xl md:rounded-l-none shadow-xl shadow-primary/20 gap-3 group/btn transition-all duration-500">
            <Search className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
            Search
          </Button>
        </div>

        {/* Popular Tags */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-2">Popular:</span>
          {["Nairobi", "Mombasa", "Kisumu", "Eldoret"].map((city) => (
            <button key={city} onClick={() => setDestination(city)} className="px-4 py-2 rounded-full bg-muted/50 hover:bg-primary/10 border border-border/50 hover:border-primary/30 text-xs font-bold transition-all hover:-translate-y-1">
              {city}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
