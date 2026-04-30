CREATE TABLE IF NOT EXISTS "user_notifications" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "schedule_id" text REFERENCES "admin_notification_schedules"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "message" text DEFAULT '' NOT NULL,
  "status" text DEFAULT 'unread' NOT NULL,
  "delivered_at" timestamp DEFAULT now() NOT NULL,
  "read_at" timestamp,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);

CREATE INDEX IF NOT EXISTS "user_notifications_user_id_idx" ON "user_notifications" ("user_id");
CREATE INDEX IF NOT EXISTS "user_notifications_status_idx" ON "user_notifications" ("status");
CREATE INDEX IF NOT EXISTS "user_notifications_delivered_at_idx" ON "user_notifications" ("delivered_at");
CREATE INDEX IF NOT EXISTS "user_notifications_schedule_id_idx" ON "user_notifications" ("schedule_id");
