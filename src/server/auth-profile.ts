import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, videos, type DbUser } from "@/db/schema";
import { normalizeAvatarUrl } from "@/lib/avatar-utils";
import { isCustomLinksSchemaError, summarizeError } from "@/lib/db-schema-mismatch";
import { ensureUniqueUsername, sanitizeUsername } from "@/lib/username";
import { isAdminEmail } from "@/server/admin-access";

export type AuthProfileUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

const legacyUserColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  image: users.image,
  coverImageUrl: users.coverImageUrl,
  avatarCropX: users.avatarCropX,
  avatarCropY: users.avatarCropY,
  avatarCropZoom: users.avatarCropZoom,
  coverCropX: users.coverCropX,
  coverCropY: users.coverCropY,
  coverCropZoom: users.coverCropZoom,
  username: users.username,
  role: users.role,
  bio: users.bio,
  experience: users.experience,
  birthDate: users.birthDate,
  city: users.city,
  address: users.address,
  contactEmail: users.contactEmail,
  phoneNumber: users.phoneNumber,
  websiteUrl: users.websiteUrl,
  instagramUrl: users.instagramUrl,
  youtubeUrl: users.youtubeUrl,
  facebookUrl: users.facebookUrl,
  threadsUrl: users.threadsUrl,
  profileVisibility: users.profileVisibility,
  skills: users.skills,
  isBlocked: users.isBlocked,
  blockedAt: users.blockedAt,
  blockedReason: users.blockedReason,
  usernameChangeCount: users.usernameChangeCount,
  usernameChangeWindowStart: users.usernameChangeWindowStart,
  locale: users.locale,
  prefersDarkMode: users.prefersDarkMode,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
} as const;

function withDefaultCustomLinks<T extends Record<string, unknown>>(row: T): DbUser {
  return {
    ...row,
    customLinks: [],
  } as unknown as DbUser;
}

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

  try {
    const existing = await db.query.users.findFirst({
      where: eq(users.id, authUser.id),
    });

    if (existing) {
      const nextUsername =
        existing.username ||
        (await ensureUniqueUsername(getPreferredUsername(authUser)));

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
  } catch (error) {
    if (!isCustomLinksSchemaError(error)) {
      throw error;
    }

    console.warn("db_schema_mismatch syncUserProfile fallback to legacy columns", {
      userId: authUser.id,
      ...summarizeError(error),
    });

    const [legacyExisting] = await db
      .select(legacyUserColumns)
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    if (legacyExisting) {
      const nextUsername =
        legacyExisting.username ||
        (await ensureUniqueUsername(getPreferredUsername(authUser)));

      const [legacyUpdated] = await db
        .update(users)
        .set({
          email,
          name: legacyExisting.name || desiredName,
          image: legacyExisting.image || desiredAvatar,
          username: nextUsername,
          role: desiredRole || legacyExisting.role,
          updatedAt: new Date(),
        })
        .where(eq(users.id, authUser.id))
        .returning(legacyUserColumns);

      return withDefaultCustomLinks(legacyUpdated);
    }

    const username = await ensureUniqueUsername(getPreferredUsername(authUser));
    const [legacyCreated] = await db
      .insert(users)
      .values({
        id: authUser.id,
        email,
        name: desiredName,
        image: desiredAvatar,
        username,
        role: desiredRole,
      })
      .returning(legacyUserColumns);

    return withDefaultCustomLinks(legacyCreated);
  }
}

export async function deleteUserAccount(userId: string) {
  await db.delete(videos).where(eq(videos.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
  await db.execute(sql`delete from auth.users where id = ${userId}::uuid`);
}
