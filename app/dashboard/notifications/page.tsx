import Link from "next/link";
import { and, eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { outbox } from "@/db/schema";
import { requireAuthenticatedUser } from "@/lib/auth/roles";
import { SubmitButton } from "@/components/ui/submit-button";
async function markRead(data: FormData) {
  "use server";
  const { userId } = await requireAuthenticatedUser();
  await db
    .update(outbox)
    .set({ readAt: new Date() })
    .where(
      and(eq(outbox.id, String(data.get("id"))), eq(outbox.userId, userId)),
    );
  revalidatePath("/dashboard/notifications");
}
export default async function Notifications() {
  const { userId } = await requireAuthenticatedUser();
  const rows = await db
    .select()
    .from(outbox)
    .where(eq(outbox.userId, userId))
    .orderBy(desc(outbox.createdAt))
    .limit(100);
  return (
    <div className="page-content">
      <h1 className="page-title">Notifications</h1>
      {rows.map((n) => (
        <div className="panel" key={n.id}>
          <Link href={n.href}>
            <h2 className={`font-semibold ${!n.readAt ? "text-primary" : ""}`}>
              {n.title}
            </h2>
            <p className="mt-2 text-sm">{n.body}</p>
          </Link>
          {!n.readAt && (
            <form action={markRead} className="mt-4">
              <input type="hidden" name="id" value={n.id} />
              <SubmitButton variant="outline">Mark read</SubmitButton>
            </form>
          )}
        </div>
      ))}
      {!rows.length && (
        <p className="empty-state">Your updates will appear here.</p>
      )}
    </div>
  );
}
