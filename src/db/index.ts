import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { getDatabaseUrl, isDatabaseUrlConfigured } from "@/lib/database/config";

const connectionString = getDatabaseUrl();
export const isDatabaseConfigured = isDatabaseUrlConfigured();

const globalForDb = globalThis as unknown as {
  showreelsSql?: postgres.Sql;
};

const activeSql = isDatabaseConfigured
  ? globalForDb.showreelsSql ||
    postgres(connectionString, {
      ssl: connectionString.includes("supabase.co") ? "require" : false,
      max: process.env.VERCEL ? 1 : 10, // Limit to 1 in serverless (Vercel)
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false, // Required for Supabase Transaction Pooler (pgbouncer)
    })
  : null;

if (process.env.NODE_ENV !== "production" && activeSql) {
  globalForDb.showreelsSql = activeSql;
}

export const db = activeSql
  ? drizzle(activeSql, { schema })
  : (null as unknown as ReturnType<typeof drizzle<typeof schema>>);

// Export sql client for CLI scripts that need to close the connection
export const sql = activeSql as postgres.Sql;
