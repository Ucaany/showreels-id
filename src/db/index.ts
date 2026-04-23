import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

const connectionString = process.env.DATABASE_URL?.trim() || "";

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is required. Set it to your Supabase PostgreSQL connection string."
  );
}

const globalForDb = globalThis as unknown as {
  showreelsPool?: Pool;
};

const requiresSsl =
  process.env.NODE_ENV === "production" ||
  connectionString.includes("sslmode=require") ||
  connectionString.includes("supabase.co");

const pool =
  globalForDb.showreelsPool ||
  new Pool({
    connectionString,
    ssl: requiresSsl ? { rejectUnauthorized: false } : false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.showreelsPool = pool;
}

export const db = drizzle(pool, { schema });
export { pool };
export const isDatabaseConfigured = Boolean(connectionString);
