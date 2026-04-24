ALTER TABLE "users" ADD COLUMN "custom_links" jsonb DEFAULT '[]'::jsonb NOT NULL;
