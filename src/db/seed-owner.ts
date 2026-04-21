import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/password";

config({ path: ".env.local" });
config();

const DEFAULT_OWNER_EMAIL = "hello@ucan.com";
const DEFAULT_OWNER_PASSWORD = "masuk123";
const DEFAULT_OWNER_NAME = "Owner VideoPort";
const DEFAULT_OWNER_USERNAME = "owner_videoport";

async function seedOwner() {
  const { db } = await import("@/db");
  const { users } = await import("@/db/schema");
  const ownerEmail = (process.env.OWNER_EMAIL || DEFAULT_OWNER_EMAIL)
    .trim()
    .toLowerCase();
  const ownerPassword = (process.env.OWNER_PASSWORD || DEFAULT_OWNER_PASSWORD).trim();
  const ownerName = (process.env.OWNER_NAME || DEFAULT_OWNER_NAME).trim();
  const ownerUsername = (process.env.OWNER_USERNAME || DEFAULT_OWNER_USERNAME).trim();

  if (!ownerEmail) {
    throw new Error("OWNER_EMAIL cannot be empty.");
  }
  if (ownerPassword.length < 8) {
    throw new Error("OWNER_PASSWORD must be at least 8 characters.");
  }

  const passwordHash = await hashPassword(ownerPassword);
  const existing = await db.query.users.findFirst({
    where: eq(users.email, ownerEmail),
    columns: { id: true },
  });

  if (existing) {
    await db
      .update(users)
      .set({
        name: ownerName,
        username: ownerUsername,
        role: "owner",
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
    console.log(`Updated owner account: ${ownerEmail}`);
  } else {
    await db.insert(users).values({
      email: ownerEmail,
      name: ownerName,
      username: ownerUsername,
      role: "owner",
      passwordHash,
    });
    console.log(`Created owner account: ${ownerEmail}`);
  }
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
