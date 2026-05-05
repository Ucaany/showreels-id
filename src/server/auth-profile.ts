import { eq, sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { users, videos, type DbUser } from "@/db/schema";
import { normalizeAvatarUrl } from "@/lib/avatar-utils";
import {
  isCustomLinksSchemaError,
  isUsersSchemaMismatchError,
  summarizeError,
} from "@/lib/db-schema-mismatch";
import { ensureUniqueUsername, sanitizeUsername } from "@/lib/username";
import { isAdminEmail } from "@/server/admin-access";

export type AuthProfileUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

const fallbackUserColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  image: users.image,
  username: users.username,
  role: users.role,
} as const;

function withDefaultCustomLinks<T extends Record<string, unknown>>(row: T): DbUser {
  return {
    id: "",
    name: "",
    email: "",
    image: null,
    coverImageUrl: "",
    avatarCropX: 0,
    avatarCropY: 0,
    avatarCropZoom: 100,
    coverCropX: 0,
    coverCropY: 0,
    coverCropZoom: 100,
    username: "",
    role: "",
    bio: "",
    experience: "",
    birthDate: "",
    city: "",
    address: "",
    contactEmail: "",
    phoneNumber: "",
    websiteUrl: "",
    instagramUrl: "",
    youtubeUrl: "",
    facebookUrl: "",
    threadsUrl: "",
    linkedinUrl: "",
    linkBuilderPublishedAt: null,
    profileVisibility: "public",
    skills: [],
    isBlocked: false,
    blockedAt: null,
    blockedReason: "",
    usernameChangeCount: 0,
    usernameChangeWindowStart: null,
    locale: "id",
    prefersDarkMode: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...row,
    customLinks: Array.isArray(row.customLinks) ? row.customLinks : [],
    linkBuilderDraft: Array.isArray(row.linkBuilderDraft) ? row.linkBuilderDraft : [],
  } as unknown as DbUser;
}

export function createFallbackAuthProfile(authUser: AuthProfileUserLike): DbUser {
  const email = authUser.email?.trim().toLowerCase() || "";
  const desiredRole = email ? (isAdminEmail(email) ? "owner" : "") : "";

  return withDefaultCustomLinks({
    id: authUser.id,
    email,
    name: getPreferredName(authUser).trim(),
    image: getPreferredAvatar(authUser),
    username: sanitizeUsername(getPreferredUsername(authUser)) || "creator",
    role: desiredRole,
  });
}

function readErrorCode(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "";
  }
  const candidate = (error as { code?: unknown }).code;
  return typeof candidate === "string" ? candidate : "";
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.toLowerCase();
  }
  if (!error || typeof error !== "object") {
    return "";
  }
  const candidate = (error as { message?: unknown }).message;
  return typeof candidate === "string" ? candidate.toLowerCase() : "";
}

function isUniqueEmailConflictError(error: unknown) {
  const code = readErrorCode(error);
  const message = readErrorMessage(error);
  if (code !== "23505") {
    return false;
  }

  return (
    message.includes("users_email_unique") ||
    (message.includes("email") && message.includes("duplicate"))
  );
}

async function safeEnsureUniqueUsername(baseInput: string) {
  try {
    return await ensureUniqueUsername(baseInput);
  } catch {
    const fallback = sanitizeUsername(baseInput);
    return fallback || "creator";
  }
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

  if (!isDatabaseConfigured) {
    return createFallbackAuthProfile(authUser);
  }

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
    const schemaMismatch =
      isCustomLinksSchemaError(error) || isUsersSchemaMismatchError(error);
    const uniqueEmailConflict = isUniqueEmailConflictError(error);

    if (!schemaMismatch && !uniqueEmailConflict) {
      console.error("syncUserProfile using fallback after unexpected error", {
        userId: authUser.id,
        ...summarizeError(error),
      });

      return createFallbackAuthProfile(authUser);
    }

    console.warn("syncUserProfile fallback mode activated", {
      userId: authUser.id,
      context: schemaMismatch ? "db_schema_mismatch" : "email_unique_conflict",
      ...summarizeError(error),
    });
    try {
      const [legacyExistingById] = await db
        .select(fallbackUserColumns)
        .from(users)
        .where(eq(users.id, authUser.id))
        .limit(1);

      if (legacyExistingById) {
        const nextUsername =
          legacyExistingById.username ||
          (await safeEnsureUniqueUsername(getPreferredUsername(authUser)));

        const [legacyUpdatedById] = await db
          .update(users)
          .set({
            email,
            name: legacyExistingById.name || desiredName,
            image: legacyExistingById.image || desiredAvatar,
            username: nextUsername,
            role: desiredRole || legacyExistingById.role,
          })
          .where(eq(users.id, authUser.id))
          .returning(fallbackUserColumns);

        return withDefaultCustomLinks(legacyUpdatedById);
      }

      const [legacyExistingByEmail] = await db
        .select(fallbackUserColumns)
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (legacyExistingByEmail) {
        const nextUsername =
          legacyExistingByEmail.username ||
          (await safeEnsureUniqueUsername(getPreferredUsername(authUser)));

        const [legacyUpdatedByEmail] = await db
          .update(users)
          .set({
            name: legacyExistingByEmail.name || desiredName,
            image: legacyExistingByEmail.image || desiredAvatar,
            username: nextUsername,
            role: desiredRole || legacyExistingByEmail.role,
          })
          .where(eq(users.id, legacyExistingByEmail.id))
          .returning(fallbackUserColumns);

        return withDefaultCustomLinks(legacyUpdatedByEmail || legacyExistingByEmail);
      }

      const username = await safeEnsureUniqueUsername(getPreferredUsername(authUser));
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
        .returning(fallbackUserColumns);

      return withDefaultCustomLinks(legacyCreated);
    } catch (fallbackError) {
      console.error("syncUserProfile fallback failed", {
        userId: authUser.id,
        ...summarizeError(fallbackError),
      });

      return createFallbackAuthProfile(authUser);
    }
  }
}

export async function deleteUserAccount(userId: string) {
  await db.delete(videos).where(eq(videos.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
  await db.execute(sql`delete from auth.users where id = ${userId}::uuid`);
}
