ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "profile_visibility" text DEFAULT 'public' NOT NULL;
