import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";
import { getDatabaseUrl, isDatabaseUrlConfigured } from "@/lib/database/config";

const connectionString = getDatabaseUrl();
export const isDatabaseConfigured = isDatabaseUrlConfigured();

const globalForDb = globalThis as unknown as {
  showreelsPool?: Pool;
};

const requiresSsl =
  isDatabaseConfigured &&
  (process.env.NODE_ENV === "production" ||
    connectionString.includes("sslmode=require") ||
    connectionString.includes("supabase.co"));

const activePool = isDatabaseConfigured
  ? globalForDb.showreelsPool ||
    new Pool({
      connectionString,
      ssl: requiresSsl ? { rejectUnauthorized: false } : false,
    })
  : null;

if (process.env.NODE_ENV !== "production" && activePool) {
  globalForDb.showreelsPool = activePool;
}

export const db = activePool
  ? drizzle(activePool, { schema })
  : (null as unknown as ReturnType<typeof drizzle<typeof schema>>);
export const pool = activePool as Pool;
