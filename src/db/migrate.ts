import { config } from "dotenv";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "@/db";

config({ path: ".env.local" });
config();

async function main() {
  await migrate(db, {
    migrationsFolder: "./drizzle",
  });
  await pool.end();
}

main().catch(async (error) => {
  console.error("Migration failed", error);
  await pool.end();
  process.exit(1);
});
