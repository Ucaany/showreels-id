import { sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";

let ensurePromise: Promise<void> | null = null;
let schemaVerified = false;

async function runOnboardingSchemaBootstrap() {
  // Only run CREATE TABLE — lightweight check
  await db.execute(sql.raw(`
CREATE TABLE IF NOT EXISTS "user_onboarding" (
  "user_id" uuid PRIMARY KEY NOT NULL,
  "onboarding_completed" boolean DEFAULT false NOT NULL,
  "onboarding_skipped" boolean DEFAULT false NOT NULL,
  "first_link_created" boolean DEFAULT false NOT NULL,
  "first_video_uploaded" boolean DEFAULT false NOT NULL,
  "has_public_profile" boolean DEFAULT false NOT NULL,
  "current_step" integer DEFAULT 1 NOT NULL,
  "progress_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "user_onboarding_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE no action
);
`));

  await db.execute(sql.raw(`
CREATE INDEX IF NOT EXISTS "user_onboarding_current_step_idx"
ON "user_onboarding" USING btree ("current_step");
`));

  await db.execute(sql.raw(`
ALTER TABLE "user_onboarding"
  ADD COLUMN IF NOT EXISTS "onboarding_skipped" boolean DEFAULT false NOT NULL;
`));

  await db.execute(sql.raw(`
ALTER TABLE "user_onboarding"
  ADD COLUMN IF NOT EXISTS "has_public_profile" boolean DEFAULT false NOT NULL;
`));

  schemaVerified = true;
}

/**
 * Backfill onboarding rows for users that don't have one yet.
 * This is separated from schema bootstrap to avoid blocking page loads.
 */
export async function backfillOnboardingRows() {
  if (!isDatabaseConfigured) return;

  try {
    await db.execute(sql.raw(`
INSERT INTO "user_onboarding" (
  "user_id",
  "onboarding_completed",
  "onboarding_skipped",
  "first_link_created",
  "first_video_uploaded",
  "has_public_profile",
  "current_step",
  "progress_payload"
)
SELECT
  u.id,
  (
    COALESCE(jsonb_array_length(COALESCE(u.custom_links, '[]'::jsonb)), 0) > 0
    OR EXISTS (SELECT 1 FROM "videos" v WHERE v."user_id" = u.id)
  ) AS onboarding_completed,
  false AS onboarding_skipped,
  COALESCE(jsonb_array_length(COALESCE(u.custom_links, '[]'::jsonb)), 0) > 0 AS first_link_created,
  EXISTS (SELECT 1 FROM "videos" v WHERE v."user_id" = u.id) AS first_video_uploaded,
  (
    length(trim(COALESCE(u."name", ''))) > 0
    AND length(trim(COALESCE(u."username", ''))) > 0
    AND (
      length(trim(COALESCE(u."bio", ''))) > 0
      OR length(trim(COALESCE(u."role", ''))) > 0
    )
  ) AS has_public_profile,
  CASE
    WHEN (
      COALESCE(jsonb_array_length(COALESCE(u.custom_links, '[]'::jsonb)), 0) > 0
      OR EXISTS (SELECT 1 FROM "videos" v WHERE v."user_id" = u.id)
    )
    THEN 4
    ELSE 1
  END AS current_step,
  '{}'::jsonb
FROM "users" u
ON CONFLICT ("user_id") DO NOTHING;
`));
  } catch (error) {
    console.error("onboarding_backfill_error", error);
  }
}

export async function ensureOnboardingSchema() {
  if (!isDatabaseConfigured) {
    return;
  }

  // If schema already verified in this process, skip
  if (schemaVerified) {
    return;
  }

  if (!ensurePromise) {
    ensurePromise = runOnboardingSchemaBootstrap().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }

  await ensurePromise;
}
