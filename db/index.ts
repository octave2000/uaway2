import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getDatabaseUrl } from "./env";
import * as schema from "./schema";

function createSqlClient() {
  return postgres(getDatabaseUrl(), {
    prepare: false,
  });
}

type SqlClient = ReturnType<typeof createSqlClient>;

function createDatabase(client: SqlClient) {
  return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDatabase>;

const globalForDatabase = globalThis as typeof globalThis & {
  __uawaySql__: SqlClient | undefined;
  __uawayDb__: Database | undefined;
};

export const sql = globalForDatabase.__uawaySql__ ?? createSqlClient();
export const db = globalForDatabase.__uawayDb__ ?? createDatabase(sql);

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.__uawaySql__ = sql;
  globalForDatabase.__uawayDb__ = db;
}

export * from "./schema";
