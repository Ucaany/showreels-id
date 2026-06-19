import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

config({ path: ".env.local" });
config();

const connectionString =
  process.env.DATABASE_URL_MIGRATION || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL_MIGRATION or DATABASE_URL must be set before running migrations."
  );
}

async function main() {
  const sql = neon(connectionString!);
  const db = drizzle(sql);
  await migrate(db, {
    migrationsFolder: "./drizzle",
  });
  console.log("Migration completed successfully.");
}

main().catch((error) => {
  console.error("Migration failed", error);
  process.exit(1);
});
