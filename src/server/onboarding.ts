import { count, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import {
  userOnboarding,
  videos,
  type DbOnboardingProgressPayload,
  type DbUserOnboarding,
} from "@/db/schema";
import { normalizeStoredLinks } from "@/lib/link-builder";
import { isRelationMissingError } from "@/server/database-errors";
import { ensureOnboardingSchema } from "@/server/onboarding-schema-bootstrap";

function buildFallbackOnboarding(
  userId: string,
  patch?: Partial<DbUserOnboarding>
): DbUserOnboarding {
  const now = new Date();
  const onboardingCompleted = patch?.onboardingCompleted ?? false;
  return {
    userId,
    onboardingCompleted,
    firstLinkCreated: patch?.firstLinkCreated ?? false,
    firstVideoUploaded: patch?.firstVideoUploaded ?? false,
    currentStep: patch?.currentStep ?? (onboardingCompleted ? 4 : 1),
    progressPayload: patch?.progressPayload ?? {},
    createdAt: now,
    updatedAt: now,
  };
}

async function countUserVideos(userId: string) {
  const rows = await db
    .select({ value: count() })
    .from(videos)
    .where(eq(videos.userId, userId));

  return Number(rows[0]?.value ?? 0);
}

export async function getOrCreateUserOnboarding(input: {
  userId: string;
  customLinks: unknown;
  createdAt?: Date | null;
}) {
  const fallbackLinksCount = normalizeStoredLinks(input.customLinks).length;
  const fallbackPatch = {
    firstLinkCreated: fallbackLinksCount > 0,
    onboardingCompleted: false,
  } satisfies Partial<DbUserOnboarding>;

  if (!isDatabaseConfigured) {
    return buildFallbackOnboarding(input.userId, fallbackPatch);
  }

  try {
    await ensureOnboardingSchema();
  } catch (error) {
    console.error("onboarding_schema_bootstrap_failed", error);
    return buildFallbackOnboarding(input.userId, fallbackPatch);
  }

  try {
    const existing = await db.query.userOnboarding.findFirst({
      where: eq(userOnboarding.userId, input.userId),
    });
    if (existing) {
      return existing;
    }

    const firstLinkCreated = normalizeStoredLinks(input.customLinks).length > 0;
    const firstVideoUploaded = (await countUserVideos(input.userId)) > 0;
    const onboardingCompleted = firstLinkCreated || firstVideoUploaded;

    const [created] = await db
      .insert(userOnboarding)
      .values({
        userId: input.userId,
        onboardingCompleted,
        firstLinkCreated,
        firstVideoUploaded,
        currentStep: onboardingCompleted ? 4 : 1,
        progressPayload: {},
      })
      .returning();

    return created;
  } catch (error) {
    if (isRelationMissingError(error, "user_onboarding")) {
      return buildFallbackOnboarding(input.userId, fallbackPatch);
    }
    throw error;
  }
}

export async function updateUserOnboardingProgress(input: {
  userId: string;
  currentStep?: number;
  onboardingCompleted?: boolean;
  firstLinkCreated?: boolean;
  firstVideoUploaded?: boolean;
  progressPayload?: DbOnboardingProgressPayload;
}) {
  if (!isDatabaseConfigured) {
    return buildFallbackOnboarding(input.userId, {
      currentStep: input.currentStep,
      onboardingCompleted: input.onboardingCompleted,
      firstLinkCreated: input.firstLinkCreated,
      firstVideoUploaded: input.firstVideoUploaded,
      progressPayload: input.progressPayload,
    });
  }

  try {
    await ensureOnboardingSchema();
  } catch (error) {
    console.error("onboarding_schema_bootstrap_failed", error);
    return buildFallbackOnboarding(input.userId, {
      currentStep: input.currentStep,
      onboardingCompleted: input.onboardingCompleted,
      firstLinkCreated: input.firstLinkCreated,
      firstVideoUploaded: input.firstVideoUploaded,
      progressPayload: input.progressPayload,
    });
  }

  try {
    const existing = await db.query.userOnboarding.findFirst({
      where: eq(userOnboarding.userId, input.userId),
    });

    const patch = {
      ...(typeof input.currentStep === "number"
        ? { currentStep: Math.min(4, Math.max(1, input.currentStep)) }
        : {}),
      ...(typeof input.onboardingCompleted === "boolean"
        ? { onboardingCompleted: input.onboardingCompleted }
        : {}),
      ...(typeof input.firstLinkCreated === "boolean"
        ? { firstLinkCreated: input.firstLinkCreated }
        : {}),
      ...(typeof input.firstVideoUploaded === "boolean"
        ? { firstVideoUploaded: input.firstVideoUploaded }
        : {}),
      ...(input.progressPayload ? { progressPayload: input.progressPayload } : {}),
      updatedAt: new Date(),
    };

    if (!existing) {
      const [created] = await db
        .insert(userOnboarding)
        .values({
          userId: input.userId,
          onboardingCompleted: input.onboardingCompleted ?? false,
          firstLinkCreated: input.firstLinkCreated ?? false,
          firstVideoUploaded: input.firstVideoUploaded ?? false,
          currentStep: Math.min(4, Math.max(1, input.currentStep ?? 1)),
          progressPayload: input.progressPayload ?? {},
          updatedAt: new Date(),
        })
        .returning();

      return created;
    }

    const [updated] = await db
      .update(userOnboarding)
      .set(patch)
      .where(eq(userOnboarding.userId, input.userId))
      .returning();

    return updated || existing;
  } catch (error) {
    if (isRelationMissingError(error, "user_onboarding")) {
      return buildFallbackOnboarding(input.userId, {
        currentStep: input.currentStep,
        onboardingCompleted: input.onboardingCompleted,
        firstLinkCreated: input.firstLinkCreated,
        firstVideoUploaded: input.firstVideoUploaded,
        progressPayload: input.progressPayload,
      });
    }
    throw error;
  }
}

export async function markFirstLinkCreated(userId: string) {
  return updateUserOnboardingProgress({
    userId,
    firstLinkCreated: true,
  });
}

export async function markFirstVideoUploaded(userId: string) {
  return updateUserOnboardingProgress({
    userId,
    firstVideoUploaded: true,
  });
}

export async function completeUserOnboarding(userId: string, progressPayload?: DbOnboardingProgressPayload) {
  return updateUserOnboardingProgress({
    userId,
    onboardingCompleted: true,
    currentStep: 4,
    progressPayload,
  });
}
