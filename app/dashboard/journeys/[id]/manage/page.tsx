import { db } from "@/db";
import { journeys, users, bookings, payments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, QrCode, CheckCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { endJourneyAction } from "./actions";
import { requireRole } from "@/lib/auth/roles";

export default async function ManageJourneyPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { userId } = await requireRole("driver");

  const [journey] = await db.select().from(journeys).where(eq(journeys.id, params.id)).limit(1);

  if (!journey || journey.driverId !== userId) {
     redirect("/dashboard/journeys");
  }

  const journeyBookings = await db
    .select({
      booking: bookings,
      client: { name: users.name, phone: users.phone, image: users.image },
      payment: payments
    })
    .from(bookings)
    .innerJoin(users, eq(bookings.clientId, users.id))
    .innerJoin(payments, eq(bookings.id, payments.bookingId))
    .where(eq(bookings.journeyId, params.id))
    .orderBy(desc(bookings.createdAt));

  const totalEarned = journeyBookings.reduce((acc, curr) => acc + curr.payment.amount, 0);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-4xl mx-auto mb-20 md:mb-0">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/journeys">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Manage Journey</h1>
          <p className="text-muted-foreground text-sm">{journey.origin} to {journey.destination}</p>
        </div>
        <Badge className="ml-auto uppercase" variant={journey.status === 'active' ? 'default' : 'secondary'}>
           {journey.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="md:col-span-2">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Users className="w-5 h-5" /> Passengers
             </CardTitle>
             <CardDescription>People who have booked this ride.</CardDescription>
           </CardHeader>
           <CardContent>
             {journeyBookings.length === 0 ? (
               <div className="text-center p-8 bg-muted/20 border rounded-lg text-muted-foreground">
                 No bookings yet.
               </div>
             ) : (
               <div className="flex flex-col gap-4">
                 {journeyBookings.map((b) => (
                   <div key={b.booking.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/10 transition-colors">
                     <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border shrink-0">
                          <AvatarImage src={b.client.image || undefined} />
                          <AvatarFallback className="text-sm bg-muted">{b.client.name?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                           <span className="font-semibold">{b.client.name}</span>
                           <span className="text-xs text-muted-foreground">{b.client.phone || "No phone provided"} • {b.booking.seatsBooked} Seat(s)</span>
                        </div>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="font-mono text-primary flex items-center gap-1">
                          <QrCode className="w-3 h-3"/> {b.booking.bookingCode}
                        </Badge>
                        <span className="text-xs font-bold text-green-600">+{b.payment.amount} KES</span>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </CardContent>
         </Card>

         <div className="flex flex-col gap-6">
           <Card className="bg-primary/5 border-primary/20">
             <CardHeader className="pb-2">
               <CardTitle className="text-sm text-primary uppercase tracking-wider">Estimated Earnings</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-4xl font-black text-primary">{totalEarned} <span className="text-lg">KES</span></div>
               <p className="text-xs text-muted-foreground mt-2">Available for withdrawal 6 hours post-ride.</p>
             </CardContent>
           </Card>

           <Card>
             <CardHeader>
               <CardTitle>Actions</CardTitle>
             </CardHeader>
             <CardContent className="flex flex-col gap-3">
               {journey.status === 'active' || journey.status === 'ongoing' ? (
                 <form action={endJourneyAction}>
                   <input type="hidden" name="journeyId" value={journey.id} />
                   <Button type="submit" className="w-full font-bold">End Journey</Button>
                 </form>
               ) : (
                 <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-md font-semibold">
                    <CheckCircle2 className="w-5 h-5" /> Completed
                 </div>
               )}
             </CardContent>
           </Card>
         </div>
      </div>
    </div>
  );
}
