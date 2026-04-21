import { config } from "dotenv";
import { upsertOwnerAccount } from "@/db/owner-utils";

config({ path: ".env.local" });
config();

async function seedOwner() {
  const result = await upsertOwnerAccount();
  console.log(
    `${result.created ? "Created" : "Updated"} owner account: ${result.email}`
  );
}

seedOwner()
  .catch((error) => {
    console.error("Failed to seed owner account", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { pool } = await import("@/db");
    await pool.end();
  });
