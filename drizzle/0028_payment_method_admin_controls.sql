-- Migration: Add payment admin controls
-- 1. Add payment_enabled to creator_settings (per-user toggle)
-- 2. Add default_payment_method to site_settings (global admin control)

ALTER TABLE "creator_settings"
ADD COLUMN IF NOT EXISTS "payment_enabled" boolean NOT NULL DEFAULT true;

ALTER TABLE "site_settings"
ADD COLUMN IF NOT EXISTS "default_payment_method" text NOT NULL DEFAULT 'bayar_gg';
