import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config();

const dbUrl =
  process.env.DATABASE_URL_MIGRATION ||
  process.env.DATABASE_URL ||
  "";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
    ssl: dbUrl.includes("supabase.co") ? "require" : false,
  },
  verbose: true,
  strict: true,
});
