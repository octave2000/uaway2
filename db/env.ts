import { z } from "zod";

const databaseEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required.")
    .regex(
      /^postgres(ql)?:\/\//,
      "DATABASE_URL must be a valid Postgres connection string.",
    ),
});

type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

let cachedDatabaseEnv: DatabaseEnv | undefined;

export function getDatabaseEnv(): DatabaseEnv {
  cachedDatabaseEnv ??= databaseEnvSchema.parse(process.env);
  return cachedDatabaseEnv;
}

export function getDatabaseUrl(): string {
  return getDatabaseEnv().DATABASE_URL;
}
