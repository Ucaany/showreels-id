import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:5432/videoport_placeholder";

const globalForDb = globalThis as unknown as {
  videoPortPool?: Pool;
};

const pool =
  globalForDb.videoPortPool ||
  new Pool({
    connectionString,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.videoPortPool = pool;
}

export const db = drizzle(pool, { schema });
export { pool };
export const isDatabaseConfigured = Boolean(process.env.DATABASE_URL);
