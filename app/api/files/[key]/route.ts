import { eq } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { auth } from "@/auth";
import { getUserRole } from "@/lib/auth/roles";
import { hasMfa, isAdminMfaRequired } from "@/lib/auth/mfa";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401 });
  const { key } = await params;
  const [file] = await db.select().from(uploads).where(eq(uploads.id, key));
  if (
    !file ||
    (file.ownerId !== session.user.id &&
      (!((await getUserRole(session.user.id)) === "super_admin") ||
        (isAdminMfaRequired() && !(await hasMfa(session.user.id)))))
  )
    return new Response(null, { status: 404 });
  const { ufsUrl } = await new UTApi().generateSignedURL(key, {
    expiresIn: 60,
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: ufsUrl,
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
