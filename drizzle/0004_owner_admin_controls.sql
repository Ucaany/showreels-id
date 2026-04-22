ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_blocked" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "blocked_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "blocked_reason" text DEFAULT '' NOT NULL;

CREATE TABLE IF NOT EXISTS "site_settings" (
  "id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
  "maintenance_enabled" boolean DEFAULT false NOT NULL,
  "pause_enabled" boolean DEFAULT false NOT NULL,
  "maintenance_message" text DEFAULT 'Website sedang dalam maintenance sementara. Silakan kembali beberapa saat lagi.' NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "visitor_events" (
  "id" text PRIMARY KEY NOT NULL,
  "visitor_id" text NOT NULL,
  "path" text DEFAULT '/' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "visitor_events_visitor_id_idx" ON "visitor_events" USING btree ("visitor_id");
CREATE INDEX IF NOT EXISTS "visitor_events_created_at_idx" ON "visitor_events" USING btree ("created_at");

INSERT INTO "site_settings" ("id")
VALUES ('global')
ON CONFLICT ("id") DO NOTHING;
