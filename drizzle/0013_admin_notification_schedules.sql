CREATE TABLE IF NOT EXISTS "admin_notification_schedules" (
  "id" text PRIMARY KEY NOT NULL,
  "notification_id" text REFERENCES "admin_notifications"("id") ON DELETE SET NULL,
  "target_type" text DEFAULT 'all' NOT NULL,
  "target_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "message" text DEFAULT '' NOT NULL,
  "status" text DEFAULT 'scheduled' NOT NULL,
  "send_mode" text DEFAULT 'now' NOT NULL,
  "recurrence" text DEFAULT 'once' NOT NULL,
  "starts_at" timestamp DEFAULT now() NOT NULL,
  "ends_at" timestamp,
  "last_sent_at" timestamp,
  "next_run_at" timestamp,
  "active_duration_days" integer DEFAULT 1 NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "admin_notification_schedules_status_idx" ON "admin_notification_schedules" ("status");
CREATE INDEX IF NOT EXISTS "admin_notification_schedules_next_run_idx" ON "admin_notification_schedules" ("next_run_at");
CREATE INDEX IF NOT EXISTS "admin_notification_schedules_target_type_idx" ON "admin_notification_schedules" ("target_type");
CREATE INDEX IF NOT EXISTS "admin_notification_schedules_target_user_idx" ON "admin_notification_schedules" ("target_user_id");
