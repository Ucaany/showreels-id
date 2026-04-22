import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, videos } from "@/db/schema";
import { normalizeAvatarUrl } from "@/lib/avatar-utils";
import { ensureUniqueUsername, sanitizeUsername } from "@/lib/username";
import { isAdminEmail } from "@/server/admin-access";

export type AuthProfileUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

function getPreferredName(user: AuthProfileUserLike) {
  const metadata = user.user_metadata || {};
  const emailPrefix = user.email?.split("@")[0] || "creator";

  return (
    metadata.full_name ||
    metadata.name ||
    metadata.display_name ||
    emailPrefix
  ).toString();
}

function getPreferredUsername(user: AuthProfileUserLike) {
  const metadata = user.user_metadata || {};
  const emailPrefix = user.email?.split("@")[0] || user.id.slice(0, 8);

  return sanitizeUsername(
    [
      metadata.user_name,
      metadata.username,
      metadata.preferred_username,
      metadata.nickname,
      emailPrefix,
    ]
      .map((value) => (typeof value === "string" ? value : ""))
      .find(Boolean) || "creator"
  );
}

function getPreferredAvatar(user: AuthProfileUserLike) {
  const metadata = user.user_metadata || {};

  return (
    normalizeAvatarUrl(
      [
        metadata.avatar_url,
        metadata.picture,
        metadata.photo_url,
      ]
        .map((value) => (typeof value === "string" ? value : ""))
        .find(Boolean) || ""
    ) || null
  );
}

export async function syncUserProfile(authUser: AuthProfileUserLike) {
  const email = authUser.email?.trim().toLowerCase();
  if (!email) {
    throw new Error("Authenticated user does not have an email address.");
  }

  const desiredRole = isAdminEmail(email) ? "owner" : "";
  const desiredName = getPreferredName(authUser).trim();
  const desiredAvatar = getPreferredAvatar(authUser);

  const existing = await db.query.users.findFirst({
    where: eq(users.id, authUser.id),
  });

  if (existing) {
    const nextUsername =
      existing.username || (await ensureUniqueUsername(getPreferredUsername(authUser)));

    const [updated] = await db
      .update(users)
      .set({
        email,
        name: existing.name || desiredName,
        image: existing.image || desiredAvatar,
        username: nextUsername,
        role: desiredRole || existing.role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, authUser.id))
      .returning();

    return updated;
  }

  const username = await ensureUniqueUsername(getPreferredUsername(authUser));
  const [created] = await db
    .insert(users)
    .values({
      id: authUser.id,
      email,
      name: desiredName,
      image: desiredAvatar,
      username,
      role: desiredRole,
    })
    .returning();

  return created;
}

export async function deleteUserAccount(userId: string) {
  await db.delete(videos).where(eq(videos.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
  await db.execute(sql`delete from auth.users where id = ${userId}::uuid`);
}
