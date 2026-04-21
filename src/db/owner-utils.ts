import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";

export const DEFAULT_OWNER_EMAIL = "hello@ucan.com";
export const DEFAULT_OWNER_PASSWORD = "masuk123";
export const DEFAULT_OWNER_NAME = "Owner VideoPort";
export const DEFAULT_OWNER_USERNAME = "owner_videoport";

export function getOwnerConfig() {
  const email = (process.env.OWNER_EMAIL || DEFAULT_OWNER_EMAIL).trim().toLowerCase();
  const password = (process.env.OWNER_PASSWORD || DEFAULT_OWNER_PASSWORD).trim();
  const name = (process.env.OWNER_NAME || DEFAULT_OWNER_NAME).trim();
  const username = (process.env.OWNER_USERNAME || DEFAULT_OWNER_USERNAME).trim();

  if (!email) {
    throw new Error("OWNER_EMAIL cannot be empty.");
  }
  if (password.length < 8) {
    throw new Error("OWNER_PASSWORD must be at least 8 characters.");
  }

  return { email, password, name, username };
}

export async function upsertOwnerAccount() {
  const { db } = await import("@/db");
  const { email, password, name, username } = getOwnerConfig();
  const passwordHash = await hashPassword(password);

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true },
  });

  if (existing) {
    await db
      .update(users)
      .set({
        name,
        username,
        role: "owner",
        passwordHash,
        failedLoginAttempts: 0,
        loginLockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
    return { id: existing.id, email, created: false };
  }

  const [created] = await db
    .insert(users)
    .values({
      email,
      name,
      username,
      role: "owner",
      passwordHash,
    })
    .returning({ id: users.id });

  return { id: created.id, email, created: true };
}
