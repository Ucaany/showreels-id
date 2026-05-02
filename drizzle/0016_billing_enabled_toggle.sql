ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "billing_enabled" boolean NOT NULL DEFAULT false;
