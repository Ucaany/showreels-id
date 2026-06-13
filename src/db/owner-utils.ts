import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";

export const DEFAULT_OWNER_EMAIL = "hello@ucan.com";
export const DEFAULT_OWNER_NAME = "Owner showreels.id";
export const DEFAULT_OWNER_USERNAME = "owner_showreels";
export const DEFAULT_OWNER_PASSWORD = "Ucan301026.";

export function getOwnerConfig() {
  const email = (process.env.OWNER_EMAIL || DEFAULT_OWNER_EMAIL).trim().toLowerCase();
  const name = (process.env.OWNER_NAME || DEFAULT_OWNER_NAME).trim();
  const username = (process.env.OWNER_USERNAME || DEFAULT_OWNER_USERNAME).trim();
  const password = process.env.OWNER_PASSWORD || DEFAULT_OWNER_PASSWORD;

  if (!email) {
    throw new Error("OWNER_EMAIL cannot be empty.");
  }

  if (!password.trim()) {
    throw new Error("OWNER_PASSWORD cannot be empty.");
  }

  return { email, name, username, password };
}

/**
 * Pastikan user owner ada di database.
 * Password akan di-hash dan di-set ulang pada tahap upsert.
 */
export async function ensureAuthUser(input: {
  email: string;
  name: string;
  username: string;
}) {
  const { db, isDatabaseConfigured } = await import("@/db");

  if (!isDatabaseConfigured || !db) {
    throw new Error("Database belum terhubung. Jalankan seed owner setelah DATABASE_URL tersedia.");
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.email, input.email),
    columns: { id: true },
  });

  if (existing) {
    return { id: existing.id, created: false };
  }

  const id = uuidv4();

  const [created] = await db
    .insert(users)
    .values({
      id,
      email: input.email,
      name: input.name,
      username: input.username,
      role: "owner",
    })
    .returning({ id: users.id });

  return { id: created.id, created: true };
}

export async function upsertOwnerAccount() {
  const { db, isDatabaseConfigured } = await import("@/db");
  const { ensureUniqueUsername } = await import("@/lib/username");

  if (!isDatabaseConfigured || !db) {
    throw new Error("Database belum terhubung. Jalankan seed owner setelah DATABASE_URL tersedia.");
  }

  const { email, name, username, password } = getOwnerConfig();
  const authUser = await ensureAuthUser({ email, name, username });
  const passwordHash = await hashPassword(password);

  const existing = await db.query.users.findFirst({
    where: eq(users.id, authUser.id),
  });

  if (existing) {
    await db
      .update(users)
      .set({
        email,
        name,
        username: existing.username || username,
        passwordHash,
        role: "owner",
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
    return { id: existing.id, email, created: false };
  }

  const uniqueUsername = await ensureUniqueUsername(username);
  const [created] = await db
    .insert(users)
    .values({
      id: authUser.id,
      email,
      name,
      username: uniqueUsername,
      passwordHash,
      role: "owner",
    })
    .returning({ id: users.id });

  return { id: created.id, email, created: authUser.created };
}
