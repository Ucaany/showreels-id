CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "audit_scans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
);

ALTER TABLE "audit_scans" ADD COLUMN IF NOT EXISTS "target_url" text DEFAULT '' NOT NULL;
ALTER TABLE "audit_scans" ADD COLUMN IF NOT EXISTS "scope" text DEFAULT 'full' NOT NULL;
ALTER TABLE "audit_scans" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'queued' NOT NULL;
ALTER TABLE "audit_scans" ADD COLUMN IF NOT EXISTS "trigger_type" text DEFAULT 'manual' NOT NULL;
ALTER TABLE "audit_scans" ADD COLUMN IF NOT EXISTS "started_at" timestamp;
ALTER TABLE "audit_scans" ADD COLUMN IF NOT EXISTS "finished_at" timestamp;
ALTER TABLE "audit_scans" ADD COLUMN IF NOT EXISTS "duration_ms" integer DEFAULT 0 NOT NULL;
ALTER TABLE "audit_scans" ADD COLUMN IF NOT EXISTS "health_score" integer DEFAULT 100 NOT NULL;
ALTER TABLE "audit_scans" ADD COLUMN IF NOT EXISTS "low_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "audit_scans" ADD COLUMN IF NOT EXISTS "medium_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "audit_scans" ADD COLUMN IF NOT EXISTS "high_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "audit_scans" ADD COLUMN IF NOT EXISTS "critical_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "audit_scans" ADD COLUMN IF NOT EXISTS "summary_json" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "audit_scans" ADD COLUMN IF NOT EXISTS "error_message" text DEFAULT '' NOT NULL;
ALTER TABLE "audit_scans" ADD COLUMN IF NOT EXISTS "created_by" uuid;
ALTER TABLE "audit_scans" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "audit_scans" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

CREATE TABLE IF NOT EXISTS "audit_findings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
);

ALTER TABLE "audit_findings" ADD COLUMN IF NOT EXISTS "scan_id" uuid;
ALTER TABLE "audit_findings" ADD COLUMN IF NOT EXISTS "category" text DEFAULT 'system' NOT NULL;
ALTER TABLE "audit_findings" ADD COLUMN IF NOT EXISTS "severity" text DEFAULT 'low' NOT NULL;
ALTER TABLE "audit_findings" ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'open' NOT NULL;
ALTER TABLE "audit_findings" ADD COLUMN IF NOT EXISTS "code" text DEFAULT 'UNKNOWN' NOT NULL;
ALTER TABLE "audit_findings" ADD COLUMN IF NOT EXISTS "title" text DEFAULT '' NOT NULL;
ALTER TABLE "audit_findings" ADD COLUMN IF NOT EXISTS "description" text DEFAULT '' NOT NULL;
ALTER TABLE "audit_findings" ADD COLUMN IF NOT EXISTS "route_or_endpoint" text DEFAULT '' NOT NULL;
ALTER TABLE "audit_findings" ADD COLUMN IF NOT EXISTS "evidence_json" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "audit_findings" ADD COLUMN IF NOT EXISTS "recommendation" text DEFAULT '' NOT NULL;
ALTER TABLE "audit_findings" ADD COLUMN IF NOT EXISTS "fingerprint" text DEFAULT gen_random_uuid()::text NOT NULL;
ALTER TABLE "audit_findings" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "audit_findings" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "audit_findings" ALTER COLUMN "scan_id" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "audit_route_checks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
);

ALTER TABLE "audit_route_checks" ADD COLUMN IF NOT EXISTS "scan_id" uuid;
ALTER TABLE "audit_route_checks" ADD COLUMN IF NOT EXISTS "route" text DEFAULT '' NOT NULL;
ALTER TABLE "audit_route_checks" ADD COLUMN IF NOT EXISTS "status_code" integer DEFAULT 0 NOT NULL;
ALTER TABLE "audit_route_checks" ADD COLUMN IF NOT EXISTS "load_time_ms" integer DEFAULT 0 NOT NULL;
ALTER TABLE "audit_route_checks" ADD COLUMN IF NOT EXISTS "payload_bytes" integer DEFAULT 0 NOT NULL;
ALTER TABLE "audit_route_checks" ADD COLUMN IF NOT EXISTS "has_title" boolean DEFAULT false NOT NULL;
ALTER TABLE "audit_route_checks" ADD COLUMN IF NOT EXISTS "has_meta_description" boolean DEFAULT false NOT NULL;
ALTER TABLE "audit_route_checks" ADD COLUMN IF NOT EXISTS "error_message" text DEFAULT '' NOT NULL;
ALTER TABLE "audit_route_checks" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "audit_route_checks" ALTER COLUMN "scan_id" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "audit_api_checks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
);

ALTER TABLE "audit_api_checks" ADD COLUMN IF NOT EXISTS "scan_id" uuid;
ALTER TABLE "audit_api_checks" ADD COLUMN IF NOT EXISTS "endpoint" text DEFAULT '' NOT NULL;
ALTER TABLE "audit_api_checks" ADD COLUMN IF NOT EXISTS "method" text DEFAULT 'GET' NOT NULL;
ALTER TABLE "audit_api_checks" ADD COLUMN IF NOT EXISTS "status_code" integer DEFAULT 0 NOT NULL;
ALTER TABLE "audit_api_checks" ADD COLUMN IF NOT EXISTS "latency_ms" integer DEFAULT 0 NOT NULL;
ALTER TABLE "audit_api_checks" ADD COLUMN IF NOT EXISTS "ok" boolean DEFAULT false NOT NULL;
ALTER TABLE "audit_api_checks" ADD COLUMN IF NOT EXISTS "error_message" text DEFAULT '' NOT NULL;
ALTER TABLE "audit_api_checks" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;
ALTER TABLE "audit_api_checks" ALTER COLUMN "scan_id" SET NOT NULL;

CREATE TABLE IF NOT EXISTS "system_health_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
);

ALTER TABLE "system_health_history" ADD COLUMN IF NOT EXISTS "scan_id" uuid;
ALTER TABLE "system_health_history" ADD COLUMN IF NOT EXISTS "health_score" integer DEFAULT 100 NOT NULL;
ALTER TABLE "system_health_history" ADD COLUMN IF NOT EXISTS "critical_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "system_health_history" ADD COLUMN IF NOT EXISTS "high_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "system_health_history" ADD COLUMN IF NOT EXISTS "medium_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "system_health_history" ADD COLUMN IF NOT EXISTS "low_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "system_health_history" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

DO $$ BEGIN
 ALTER TABLE "audit_scans" ADD CONSTRAINT "audit_scans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
 ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_scan_id_audit_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."audit_scans"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
 ALTER TABLE "audit_route_checks" ADD CONSTRAINT "audit_route_checks_scan_id_audit_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."audit_scans"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
 ALTER TABLE "audit_api_checks" ADD CONSTRAINT "audit_api_checks_scan_id_audit_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."audit_scans"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
 ALTER TABLE "system_health_history" ADD CONSTRAINT "system_health_history_scan_id_audit_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."audit_scans"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS "audit_scans_status_idx" ON "audit_scans" ("status");
CREATE INDEX IF NOT EXISTS "audit_scans_created_at_idx" ON "audit_scans" ("created_at");
CREATE INDEX IF NOT EXISTS "audit_scans_trigger_type_idx" ON "audit_scans" ("trigger_type");
CREATE INDEX IF NOT EXISTS "audit_findings_scan_id_idx" ON "audit_findings" ("scan_id");
CREATE INDEX IF NOT EXISTS "audit_findings_severity_idx" ON "audit_findings" ("severity");
CREATE INDEX IF NOT EXISTS "audit_findings_category_idx" ON "audit_findings" ("category");
CREATE INDEX IF NOT EXISTS "audit_findings_status_idx" ON "audit_findings" ("status");
CREATE INDEX IF NOT EXISTS "audit_findings_fingerprint_idx" ON "audit_findings" ("fingerprint");
CREATE INDEX IF NOT EXISTS "audit_route_checks_scan_id_idx" ON "audit_route_checks" ("scan_id");
CREATE INDEX IF NOT EXISTS "audit_route_checks_route_idx" ON "audit_route_checks" ("route");
CREATE INDEX IF NOT EXISTS "audit_api_checks_scan_id_idx" ON "audit_api_checks" ("scan_id");
CREATE INDEX IF NOT EXISTS "audit_api_checks_endpoint_idx" ON "audit_api_checks" ("endpoint");
CREATE INDEX IF NOT EXISTS "system_health_history_created_at_idx" ON "system_health_history" ("created_at");
