CREATE INDEX IF NOT EXISTS "videos_user_source_visibility_idx"
ON "videos" USING btree ("user_id", "source", "visibility");
