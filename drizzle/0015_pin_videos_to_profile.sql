ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "pinned_to_profile" boolean DEFAULT false NOT NULL;
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "pinned_order" integer DEFAULT 0 NOT NULL;
CREATE INDEX IF NOT EXISTS "videos_user_pinned_idx" ON "videos" ("user_id", "pinned_to_profile", "pinned_order");
