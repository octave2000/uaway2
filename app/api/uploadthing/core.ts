import { auth } from "@/auth";

import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

async function requireUploadUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new UploadThingError("Unauthorized");
  }

  return { userId: session.user.id };
}

export const uploadRouter = {
  carPhoto: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(requireUploadUser)
    .onUploadComplete(async ({ file }) => ({
      url: file.ufsUrl,
      name: file.name,
    })),
  carDocument: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
    pdf: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    .middleware(requireUploadUser)
    .onUploadComplete(async ({ file }) => ({
      url: file.ufsUrl,
      name: file.name,
    })),
  identityDocument: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
    pdf: {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    .middleware(requireUploadUser)
    .onUploadComplete(async ({ file }) => ({
      url: file.ufsUrl,
      name: file.name,
    })),
  selfiePhoto: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(requireUploadUser)
    .onUploadComplete(async ({ file }) => ({
      url: file.ufsUrl,
      name: file.name,
    })),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
