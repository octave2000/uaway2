import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { supportCases } from "@/db/schema";
import { requireAuthenticatedUser } from "@/lib/auth/roles";
import { SubmitButton } from "@/components/ui/submit-button";
import { Notice } from "@/components/shared/notice";
import { supportAction } from "./actions";
export default async function Support({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string; error?: string }>;
}) {
  const { userId } = await requireAuthenticatedUser();
  const { bookingId, error } = await searchParams;
  const cases = await db
    .select()
    .from(supportCases)
    .where(eq(supportCases.userId, userId))
    .orderBy(desc(supportCases.createdAt))
    .limit(50);
  return (
    <div className="page-content">
      <h1 className="page-title">How can we help?</h1>
      <p className="page-description">
        Report a payment, journey, or account problem. Booking-related issues
        put unsettled funds on hold.
      </p>
      <Notice error={error} />
      <form action={supportAction} className="panel space-y-4">
        <input type="hidden" name="bookingId" value={bookingId ?? ""} />
        {bookingId && <p className="break-all text-xs">Booking: {bookingId}</p>}
        <label className="field">
          Subject
          <input
            className="control"
            name="subject"
            minLength={3}
            maxLength={120}
            required
          />
        </label>
        <label className="field">
          What happened?
          <textarea
            className="control min-h-32"
            name="message"
            minLength={10}
            maxLength={4000}
            required
          />
        </label>
        <SubmitButton>Send support request</SubmitButton>
      </form>
      <h2 className="text-xl font-semibold">Your requests</h2>
      {cases.map((c) => (
        <div className="panel" key={c.id}>
          <h3 className="font-semibold">
            {c.subject}{" "}
            <span className="float-right text-sm font-normal">{c.status}</span>
          </h3>
          <p className="mt-3 whitespace-pre-wrap text-sm">{c.message}</p>
          {c.resolution && (
            <p className="mt-4 rounded-lg bg-muted p-4 text-sm">
              Support: {c.resolution}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
