import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { journeys, users, cars } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, Users, Car, ArrowRight, Search, ShieldCheck, Zap, Star } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { Navbar } from "@/components/layout/navbar";

export default async function Home() {
  const session = await auth();

  // Fetch recent active journeys
  const availableJourneys = await db.select({
    journey: journeys,
    driver: { name: users.name, image: users.image },
    car: { name: cars.name }
  }).from(journeys)
    .innerJoin(users, eq(journeys.driverId, users.id))
    .innerJoin(cars, eq(journeys.carId, cars.id))
    .where(eq(journeys.status, "active"))
    .orderBy(desc(journeys.createdAt))
    .limit(8);

  return (
    <div className="flex flex-col min-h-screen bg-background selection:bg-primary/20">
      <Navbar session={session} />

      <main className="flex-1 pt-24 md:pt-32">
        {/* Simple Search Section */}
        <section className="px-4 pb-12">
          <div className="container mx-auto max-w-4xl">
            <div className="flex flex-col items-center gap-8">
              <div className="text-center space-y-2">
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground">
                  Find your next <span className="text-primary italic">Journey.</span>
                </h1>
                <p className="text-sm md:text-base font-medium text-muted-foreground/80">
                  Premium ride sharing across Kenya. Verified and Safe.
                </p>
              </div>

              <div className="w-full max-w-3xl">
                <div className="relative group p-1.5 rounded-[1.5rem] md:rounded-[2.5rem] bg-background/40 backdrop-blur-3xl border border-border/50 shadow-xl">
                  <div className="flex flex-col md:flex-row items-center gap-2">
                    <div className="flex-1 w-full flex items-center px-4 h-12 md:h-14">
                      <Search className="w-5 h-5 text-primary mr-3 shrink-0" />
                      <input 
                        type="text" 
                        placeholder="Where are you heading?"
                        className="flex-1 bg-transparent outline-none text-sm md:text-lg font-bold placeholder:text-muted-foreground/40 w-full"
                      />
                    </div>
                    <div className="w-full md:w-auto">
                      <Button className="w-full md:w-auto h-12 md:h-14 rounded-[1rem] md:rounded-[1.8rem] px-8 bg-primary text-white hover:bg-primary/90 font-black text-sm md:text-base shadow-lg shadow-primary/20 transition-all duration-500">
                        Search Rides
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Rides Feed */}
        <section id="discover" className="py-12 bg-muted/5">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex flex-col">
                <h2 className="text-xl md:text-2xl font-black tracking-tighter uppercase tracking-widest text-primary">Live Rides</h2>
                <div className="h-1 w-12 bg-primary mt-1 rounded-full" />
              </div>
              <Link href="/register">
                <Button variant="ghost" size="sm" className="font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:text-primary">
                  View All <ArrowRight className="ml-1 w-3 h-3" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {availableJourneys.map((data) => (
                <Link 
                  key={data.journey.id}
                  href={`/dashboard/journeys/${data.journey.id}`}
                  className="group"
                >
                  <Card className="h-full rounded-[2rem] overflow-hidden border border-border/10 bg-background hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden relative border border-border/50">
                            {data.driver.image ? (
                              <Image src={data.driver.image} alt={data.driver.name || ""} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black text-xs">
                                {data.driver.name?.[0]}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-xs">{data.driver.name?.split(' ')[0]}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-primary">Host</span>
                          </div>
                        </div>
                        <div className="bg-primary/10 px-2 py-0.5 rounded-full">
                           <span className="text-[10px] font-black text-primary uppercase">KES {data.journey.pricePerSeat}</span>
                        </div>
                      </div>

                      <div className="flex-1 space-y-2 relative mb-6">
                        <div className="absolute left-[13px] top-[14px] bottom-[14px] w-[1px] bg-border" />
                        <div className="flex items-start gap-4">
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 z-10 border border-border">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          </div>
                          <div className="flex flex-col pt-1">
                            <span className="text-[8px] font-black text-muted-foreground uppercase leading-none mb-1">From</span>
                            <span className="font-bold text-sm truncate">{data.journey.origin}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 z-10 border border-border">
                             <MapPin className="w-3.5 h-3.5 text-secondary" />
                          </div>
                          <div className="flex flex-col pt-1">
                            <span className="text-[8px] font-black text-muted-foreground uppercase leading-none mb-1">To</span>
                            <span className="font-bold text-sm truncate">{data.journey.destination}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase">{format(new Date(data.journey.departureTime), "MMM d")}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase">{data.journey.seatsAvailable} Left</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              
              {availableJourneys.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center gap-4 bg-muted/20 rounded-[2rem] border-2 border-dashed border-border/50">
                   <Car className="w-12 h-12 text-muted-foreground/20" />
                   <h3 className="text-lg font-bold text-muted-foreground/40 text-center px-4">No active journeys found</h3>
                   <Button asChild variant="outline" size="sm" className="rounded-full font-black uppercase tracking-widest text-[10px]">
                     <Link href="/register">Post First Journey</Link>
                   </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 border-t border-border/50">
           <div className="container mx-auto px-4 max-w-5xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { icon: ShieldCheck, title: "Verified", desc: "Safety first with official ID checks.", color: "primary" },
                  { icon: Zap, title: "Instant", desc: "No waiting. Book seats in seconds.", color: "secondary" },
                  { icon: Users, title: "Social", desc: "Share costs and save the planet.", color: "primary" }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center gap-4 p-8 rounded-[2rem] bg-background border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <div className={`w-12 h-12 rounded-2xl bg-${item.color}/10 flex items-center justify-center text-${item.color}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-black tracking-tight uppercase tracking-widest">{item.title}</h3>
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-20 p-10 rounded-[3rem] bg-primary text-white text-center relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-110" />
                 <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4">Have an extra seat?</h2>
                 <p className="text-lg font-medium opacity-90 mb-8 max-w-2xl mx-auto">Turn your empty car seats into extra cash while helping others travel sustainably.</p>
                 <Button asChild size="lg" className="rounded-full bg-white text-primary hover:bg-white/90 font-black uppercase tracking-widest text-xs h-14 px-10">
                   <Link href="/dashboard/journeys/new">Add Your Journey</Link>
                 </Button>
              </div>
           </div>
        </section>
      </main>

      <footer className="py-12 border-t border-border/50 bg-background">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col items-center gap-8">
           <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden relative border border-border/50 shadow-sm">
                <Image src="/logo.jpg" alt="Logo" fill className="object-cover" />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase italic">UAWAY</span>
            </Link>
            
            <div className="flex flex-wrap justify-center items-center gap-8">
              <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Privacy</Link>
              <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Terms</Link>
              <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Support</Link>
            </div>
            
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-40">© 2026 UAWAY LTD • KENYA</p>
        </div>
      </footer>
    </div>
  );
}
