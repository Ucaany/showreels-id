CREATE TABLE IF NOT EXISTS "audit_scans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "target_url" text NOT NULL,
  "scope" text DEFAULT 'full' NOT NULL,
  "status" text DEFAULT 'queued' NOT NULL,
  "trigger_type" text DEFAULT 'manual' NOT NULL,
  "started_at" timestamp,
  "finished_at" timestamp,
  "duration_ms" integer DEFAULT 0 NOT NULL,
  "health_score" integer DEFAULT 100 NOT NULL,
  "low_count" integer DEFAULT 0 NOT NULL,
  "medium_count" integer DEFAULT 0 NOT NULL,
  "high_count" integer DEFAULT 0 NOT NULL,
  "critical_count" integer DEFAULT 0 NOT NULL,
  "summary_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "error_message" text DEFAULT '' NOT NULL,
  "created_by" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_findings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scan_id" uuid NOT NULL,
  "category" text NOT NULL,
  "severity" text NOT NULL,
  "status" text DEFAULT 'open' NOT NULL,
  "code" text NOT NULL,
  "title" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "route_or_endpoint" text DEFAULT '' NOT NULL,
  "evidence_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "recommendation" text DEFAULT '' NOT NULL,
  "fingerprint" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_route_checks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scan_id" uuid NOT NULL,
  "route" text NOT NULL,
  "status_code" integer DEFAULT 0 NOT NULL,
  "load_time_ms" integer DEFAULT 0 NOT NULL,
  "payload_bytes" integer DEFAULT 0 NOT NULL,
  "has_title" boolean DEFAULT false NOT NULL,
  "has_meta_description" boolean DEFAULT false NOT NULL,
  "error_message" text DEFAULT '' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "audit_api_checks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scan_id" uuid NOT NULL,
  "endpoint" text NOT NULL,
  "method" text DEFAULT 'GET' NOT NULL,
  "status_code" integer DEFAULT 0 NOT NULL,
  "latency_ms" integer DEFAULT 0 NOT NULL,
  "ok" boolean DEFAULT false NOT NULL,
  "error_message" text DEFAULT '' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "system_health_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "scan_id" uuid,
  "health_score" integer NOT NULL,
  "critical_count" integer DEFAULT 0 NOT NULL,
  "high_count" integer DEFAULT 0 NOT NULL,
  "medium_count" integer DEFAULT 0 NOT NULL,
  "low_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

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
