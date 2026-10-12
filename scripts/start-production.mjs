import { cp } from "node:fs/promises";

// Next standalone output intentionally excludes static and public assets from its trace.
await cp("public", ".next/standalone/public", { recursive: true, force: true });
await cp(".next/static", ".next/standalone/.next/static", {
  recursive: true,
  force: true,
});
await import("../.next/standalone/server.js");
