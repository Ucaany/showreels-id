-- Migration: Public portfolio cursor pagination index
-- Created: 2026-05-12

CREATE INDEX IF NOT EXISTS "videos_public_cursor_idx"
  ON "videos" ("user_id", "visibility", "created_at" DESC, "id" DESC);
