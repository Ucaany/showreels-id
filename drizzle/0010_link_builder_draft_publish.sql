ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "link_builder_draft" jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "link_builder_published_at" timestamp;
