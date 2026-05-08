import { eq } from "drizzle-orm";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { v4 as uuidv4 } from "uuid";

export const DEFAULT_OWNER_EMAIL = "hello@ucan.com";
export const DEFAULT_OWNER_PASSWORD = "masuk123";
export const DEFAULT_OWNER_NAME = "Owner showreels.id";
export const DEFAULT_OWNER_USERNAME = "owner_showreels";

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

export async function ensureAuthUser(input: {
  email: string;
  password: string;
  name: string;
  username: string;
}) {
  const { db } = await import("@/db");

  // Check if user already exists by email
  const existing = await db.query.users.findFirst({
    where: eq(users.email, input.email),
    columns: { id: true },
  });

  if (existing) {
    return { id: existing.id, created: false };
  }

  // Create new user with hashed password
  const passwordHash = await hashPassword(input.password);
  const id = uuidv4();

  const [created] = await db
    .insert(users)
    .values({
      id,
      email: input.email,
      name: input.name,
      username: input.username,
      passwordHash,
      role: "owner",
    })
    .returning({ id: users.id });

  return { id: created.id, created: true };
}

export async function upsertOwnerAccount() {
  const { db } = await import("@/db");
  const { ensureUniqueUsername } = await import("@/lib/username");
  const { email, password, name, username } = getOwnerConfig();
  const authUser = await ensureAuthUser({
    email,
    password,
    name,
    username,
  });

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
        role: "owner",
        updatedAt: new Date(),
      })
      .where(eq(users.id, existing.id));
    return { id: existing.id, email, created: false };
  }

  const uniqueUsername = await ensureUniqueUsername(username);
  const passwordHash = await hashPassword(password);
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
