import { sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";

let ensurePromise: Promise<void> | null = null;

async function runOnboardingSchemaBootstrap() {
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

  await db.execute(sql.raw(`
UPDATE "user_onboarding" uo
SET
  "onboarding_completed" = false,
  "onboarding_skipped" = false,
  "first_link_created" = false,
  "first_video_uploaded" = false,
  "has_public_profile" = false,
  "current_step" = 1,
  "updated_at" = now()
FROM "users" u
WHERE
  uo."user_id" = u."id"
  AND lower(COALESCE(u."role", '')) <> 'owner'
  AND uo."onboarding_completed" = true
  AND COALESCE(jsonb_array_length(COALESCE(u."custom_links", '[]'::jsonb)), 0) = 0
  AND NOT EXISTS (SELECT 1 FROM "videos" v WHERE v."user_id" = u."id");
`));

  await db.execute(sql.raw(`
UPDATE "user_onboarding" uo
SET
  "has_public_profile" = (
    length(trim(COALESCE(u."name", ''))) > 0
    AND length(trim(COALESCE(u."username", ''))) > 0
    AND (
      length(trim(COALESCE(u."bio", ''))) > 0
      OR length(trim(COALESCE(u."role", ''))) > 0
    )
  ),
  "updated_at" = now()
FROM "users" u
WHERE uo."user_id" = u."id";
`));
}

export async function ensureOnboardingSchema() {
  if (!isDatabaseConfigured) {
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
