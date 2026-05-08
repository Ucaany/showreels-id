import { createClient } from "@supabase/supabase-js";
import { eq, sql } from "drizzle-orm";
import { users } from "@/db/schema";

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

function createSupabaseAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required."
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function ensureAuthUser(input: {
  email: string;
  password: string;
  name: string;
  username: string;
}) {
  const { db } = await import("@/db");
  const existing = await db.execute<{ id: string }>(
    sql`select id::text as id from auth.users where email = ${input.email} limit 1`
  );

  const existingId = existing.rows[0]?.id;
  if (existingId) {
    return { id: existingId, created: false };
  }

  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.name,
        username: input.username,
      },
      emailRedirectTo:
        process.env.NEXT_PUBLIC_APP_URL || "https://showreels.id",
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message || "Failed to create Supabase auth user.");
  }

  return { id: data.user.id, created: true };
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
  const [created] = await db
    .insert(users)
    .values({
      id: authUser.id,
      email,
      name,
      username: uniqueUsername,
      role: "owner",
    })
    .returning({ id: users.id });

  return { id: created.id, email, created: authUser.created };
}
