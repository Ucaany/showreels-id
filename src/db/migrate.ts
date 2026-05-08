import { config } from "dotenv";
import { migrate } from "drizzle-orm/postgres-js/migrator";

config({ path: ".env.local" });
config();

if (!process.env.DATABASE_URL_MIGRATION && !process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL_MIGRATION or DATABASE_URL must be set before running migrations."
  );
}

async function main() {
  const { db, sql } = await import("@/db");
  await migrate(db, {
    migrationsFolder: "./drizzle",
  });
  await sql.end();
}

main().catch(async (error) => {
  console.error("Migration failed", error);
  const { sql } = await import("@/db");
  await sql.end();
  process.exit(1);
});
