-- Migration: Email System (email_logs, email_queue_jobs, email_enabled toggle)
-- Created: 2026-05-08

-- 1. Add email_enabled column to site_settings
ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "email_enabled" boolean NOT NULL DEFAULT true;

-- 2. Create email_logs table
CREATE TABLE IF NOT EXISTS "email_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "email_type" text NOT NULL,
  "recipient_email" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "provider" text NOT NULL DEFAULT 'resend',
  "message_id" text,
  "error_message" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "email_logs_user_id_idx" ON "email_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "email_logs_status_idx" ON "email_logs" ("status");
CREATE INDEX IF NOT EXISTS "email_logs_created_at_idx" ON "email_logs" ("created_at");
CREATE INDEX IF NOT EXISTS "email_logs_type_status_idx" ON "email_logs" ("email_type", "status");

-- 3. Create email_queue_jobs table
CREATE TABLE IF NOT EXISTS "email_queue_jobs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "status" text NOT NULL DEFAULT 'pending',
  "retry_count" integer NOT NULL DEFAULT 0,
  "last_error" text,
  "next_retry_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "processed_at" timestamp
);

CREATE INDEX IF NOT EXISTS "email_queue_jobs_status_idx" ON "email_queue_jobs" ("status");
CREATE INDEX IF NOT EXISTS "email_queue_jobs_next_retry_idx" ON "email_queue_jobs" ("status", "next_retry_at");
