import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { DomainError } from "./policy";
export async function ownedFile(userId: string, url: string, kind: string) {
  const key =
    kind === "carPhoto" || kind === "profilePhoto"
      ? url.split("/").pop()
      : url.startsWith("/api/files/")
        ? decodeURIComponent(url.slice(11))
        : null;
  if (!key)
    throw new DomainError("file", "Upload the requested file using this form.");
  const [file] = await db
    .select()
    .from(uploads)
    .where(
      and(
        eq(uploads.id, key),
        eq(uploads.ownerId, userId),
        eq(uploads.kind, kind),
      ),
    );
  if (!file)
    throw new DomainError("file", "This file does not belong to your account.");
  return kind === "carPhoto" || kind === "profilePhoto"
    ? url
    : `/api/files/${encodeURIComponent(key)}`;
}
