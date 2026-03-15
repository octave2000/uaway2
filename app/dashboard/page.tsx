import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MapPin, Calendar, Users, Briefcase, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardHome() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-5xl mx-auto">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back, {session.user.name?.split(' ')[0] || 'Traveler'}</h1>
        <p className="text-muted-foreground text-sm">Find your next ride or post a journey.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
         {/* Beautiful Action Cards */}
         <Card className="bg-primary/5 border-primary/20 shadow-sm relative overflow-hidden">
           <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
           <CardHeader>
             <CardTitle className="text-lg">Need a Ride?</CardTitle>
             <CardDescription>Browse available journeys and book a seat instantly.</CardDescription>
           </CardHeader>
           <CardContent>
             <Button className="w-full text-sm font-semibold tracking-wide" asChild>
               <Link href="/dashboard/journeys">Find Journeys</Link>
             </Button>
           </CardContent>
         </Card>

         <Card className="bg-secondary/5 border-secondary/20 shadow-sm relative overflow-hidden">
           <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />
           <CardHeader>
             <CardTitle className="text-lg">Driving Somewhere?</CardTitle>
             <CardDescription>Post your journey and share the cost with passengers.</CardDescription>
           </CardHeader>
           <CardContent>
             <Button variant="secondary" className="w-full text-sm font-semibold tracking-wide" asChild>
               <Link href="/dashboard/journeys/new">Post a Journey</Link>
             </Button>
           </CardContent>
         </Card>
      </div>

      {/* Recommended Journeys Placeholder */}
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Active Journeys</h2>
          <Button variant="link" className="text-sm font-medium h-auto p-0">View all</Button>
        </div>
        
        <div className="flex flex-col gap-3">
          {/* Mock Journey Card */}
          <Card className="p-4 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-border/50 group">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <span>Nairobi</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <span>Mombasa</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Oct 24, 08:00 AM</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-lg font-bold text-primary">1,500 KES</span>
                <span className="text-xs text-muted-foreground">per seat</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground border-t pt-3 border-border/50">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>3 seats left</span>
              </div>
              <div className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Med. Luggage</span>
              </div>
              <div className="ml-auto flex items-center gap-2 text-foreground group-hover:text-primary transition-colors">
                 <span className="text-[10px] md:text-sm">Driver: John Doe</span>
                 <div className="w-6 h-6 rounded-full bg-muted border overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" alt="avatar" className="w-full h-full object-cover" />
                 </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
