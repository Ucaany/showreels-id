import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql as drizzleSql } from "drizzle-orm";
import * as schema from "@/db/schema";
import { getDatabaseUrl, isDatabaseUrlConfigured } from "@/lib/database/config";

const connectionString = getDatabaseUrl();
export const isDatabaseConfigured = isDatabaseUrlConfigured();

const neonSql = isDatabaseConfigured ? neon(connectionString) : null;

export const db = neonSql
  ? drizzle(neonSql, { schema })
  : (null as unknown as ReturnType<typeof drizzle<typeof schema>>);

/** Re-export drizzle sql template tag for raw queries */
export const sql = drizzleSql;

/** Re-export raw neon query function for direct SQL execution */
export { neonSql };
