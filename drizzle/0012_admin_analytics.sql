CREATE TABLE IF NOT EXISTS "analytics_events" (
  "id" text PRIMARY KEY NOT NULL,
  "visitor_id" text NOT NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "video_id" text REFERENCES "videos"("id") ON DELETE SET NULL,
  "event_type" text DEFAULT 'page_view' NOT NULL,
  "path" text DEFAULT '/' NOT NULL,
  "target_type" text DEFAULT 'page' NOT NULL,
  "target_id" text DEFAULT '' NOT NULL,
  "target_url" text DEFAULT '' NOT NULL,
  "country" text DEFAULT '' NOT NULL,
  "city" text DEFAULT '' NOT NULL,
  "region" text DEFAULT '' NOT NULL,
  "device" text DEFAULT '' NOT NULL,
  "referrer" text DEFAULT '' NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "analytics_events_event_type_idx" ON "analytics_events" ("event_type");
CREATE INDEX IF NOT EXISTS "analytics_events_created_at_idx" ON "analytics_events" ("created_at");
CREATE INDEX IF NOT EXISTS "analytics_events_user_id_idx" ON "analytics_events" ("user_id");
CREATE INDEX IF NOT EXISTS "analytics_events_video_id_idx" ON "analytics_events" ("video_id");
CREATE INDEX IF NOT EXISTS "analytics_events_geo_idx" ON "analytics_events" ("country", "city");

CREATE TABLE IF NOT EXISTS "video_engagement_stats" (
  "video_id" text PRIMARY KEY NOT NULL REFERENCES "videos"("id") ON DELETE CASCADE,
  "views" integer DEFAULT 0 NOT NULL,
  "unique_visitors" integer DEFAULT 0 NOT NULL,
  "clicks" integer DEFAULT 0 NOT NULL,
  "shares" integer DEFAULT 0 NOT NULL,
  "likes" integer DEFAULT 0 NOT NULL,
  "last_event_at" timestamp,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "admin_notifications" (
  "id" text PRIMARY KEY NOT NULL,
  "type" text DEFAULT 'system' NOT NULL,
  "severity" text DEFAULT 'info' NOT NULL,
  "title" text NOT NULL,
  "message" text DEFAULT '' NOT NULL,
  "entity_type" text DEFAULT '' NOT NULL,
  "entity_id" text DEFAULT '' NOT NULL,
  "is_read" boolean DEFAULT false NOT NULL,
  "read_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "admin_notifications_is_read_idx" ON "admin_notifications" ("is_read");
CREATE INDEX IF NOT EXISTS "admin_notifications_created_at_idx" ON "admin_notifications" ("created_at");
CREATE INDEX IF NOT EXISTS "admin_notifications_severity_idx" ON "admin_notifications" ("severity");
