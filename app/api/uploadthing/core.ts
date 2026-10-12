import { auth } from "@/auth";
import { db } from "@/db";
import { uploads } from "@/db/schema";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { limit } from "@/lib/domain/shared";
const f = createUploadthing();
async function requireUploadUser() {
  const session = await auth();
  if (!session?.user?.id) throw new UploadThingError("Unauthorized");
  await limit(`upload:${session.user.id}`, 20, 3600000);
  return { userId: session.user.id };
}
async function save(
  ownerId: string,
  key: string,
  kind: string,
  isPrivate: boolean,
  url: string,
) {
  await db
    .insert(uploads)
    .values({ id: key, ownerId, kind, private: isPrivate })
    .onConflictDoNothing();
  return { url: isPrivate ? `/api/files/${encodeURIComponent(key)}` : url };
}
export const uploadRouter = {
  carPhoto: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(requireUploadUser)
    .onUploadComplete(({ metadata, file }) =>
      save(metadata.userId, file.key, "carPhoto", false, file.ufsUrl),
    ),
  profilePhoto: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(requireUploadUser)
    .onUploadComplete(({ metadata, file }) =>
      save(metadata.userId, file.key, "profilePhoto", false, file.ufsUrl),
    ),
  carDocument: f({
    image: { maxFileSize: "8MB", maxFileCount: 1, acl: "private" },
    pdf: { maxFileSize: "8MB", maxFileCount: 1, acl: "private" },
  })
    .middleware(requireUploadUser)
    .onUploadComplete(({ metadata, file }) =>
      save(metadata.userId, file.key, "carDocument", true, file.ufsUrl),
    ),
  insuranceDocument: f({
    image: { maxFileSize: "8MB", maxFileCount: 1, acl: "private" },
    pdf: { maxFileSize: "8MB", maxFileCount: 1, acl: "private" },
  })
    .middleware(requireUploadUser)
    .onUploadComplete(({ metadata, file }) =>
      save(metadata.userId, file.key, "insuranceDocument", true, file.ufsUrl),
    ),
  identityDocument: f({
    image: { maxFileSize: "8MB", maxFileCount: 1, acl: "private" },
    pdf: { maxFileSize: "8MB", maxFileCount: 1, acl: "private" },
  })
    .middleware(requireUploadUser)
    .onUploadComplete(({ metadata, file }) =>
      save(metadata.userId, file.key, "identityDocument", true, file.ufsUrl),
    ),
  selfiePhoto: f({
    image: { maxFileSize: "4MB", maxFileCount: 1, acl: "private" },
  })
    .middleware(requireUploadUser)
    .onUploadComplete(({ metadata, file }) =>
      save(metadata.userId, file.key, "selfiePhoto", true, file.ufsUrl),
    ),
} satisfies FileRouter;
export type UploadRouter = typeof uploadRouter;
