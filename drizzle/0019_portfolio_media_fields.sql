-- Migration: Portfolio media fields + indexing
-- Created: 2026-05-10

ALTER TABLE "videos"
  ADD COLUMN IF NOT EXISTS "media_type" text NOT NULL DEFAULT 'video',
  ADD COLUMN IF NOT EXISTS "preview_type" text NOT NULL DEFAULT 'upload',
  ADD COLUMN IF NOT EXISTS "preview_image" text NOT NULL DEFAULT '';

-- Backfill existing rows to keep behavior deterministic
UPDATE "videos"
SET
  "media_type" = CASE
    WHEN coalesce("source_url", '') <> '' THEN 'video'
    WHEN jsonb_array_length(coalesce("image_urls", '[]'::jsonb)) > 0 THEN 'image'
    ELSE 'video'
  END,
  "preview_type" = CASE
    WHEN "source" IN ('youtube', 'tiktok', 'vimeo', 'instagram', 'facebook', 'gdrive') THEN "source"
    WHEN coalesce("source_url", '') <> '' THEN 'upload'
    WHEN jsonb_array_length(coalesce("image_urls", '[]'::jsonb)) > 0 THEN 'image'
    ELSE 'upload'
  END,
  "preview_image" = CASE
    WHEN coalesce("thumbnail_url", '') <> '' THEN "thumbnail_url"
    ELSE '/default-thumbnail.jpg'
  END;

CREATE INDEX IF NOT EXISTS "videos_user_media_visibility_created_idx"
  ON "videos" ("user_id", "media_type", "visibility", "created_at");
