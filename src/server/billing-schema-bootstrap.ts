import { sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";

let ensurePromise: Promise<void> | null = null;

async function runBillingSchemaBootstrap() {
  await db.execute(sql.raw(`
CREATE TABLE IF NOT EXISTS "creator_settings" (
  "user_id" uuid PRIMARY KEY NOT NULL,
  "public_profile" boolean DEFAULT true NOT NULL,
  "search_indexing" boolean DEFAULT true NOT NULL,
  "show_public_email" boolean DEFAULT false NOT NULL,
  "show_social_links" boolean DEFAULT true NOT NULL,
  "show_public_stats" boolean DEFAULT false NOT NULL,
  "whitelabel_enabled" boolean DEFAULT false NOT NULL,
  "billing_email" text DEFAULT '' NOT NULL,
  "payment_method" text DEFAULT 'midtrans' NOT NULL,
  "tax_info" text DEFAULT '' NOT NULL,
  "invoice_notes" text DEFAULT '' NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "creator_settings_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE no action
);
`));

  await db.execute(sql.raw(`
CREATE INDEX IF NOT EXISTS "creator_settings_billing_email_idx"
ON "creator_settings" USING btree ("billing_email");
`));

  await db.execute(sql.raw(`
CREATE TABLE IF NOT EXISTS "billing_subscriptions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "plan_name" text DEFAULT 'free' NOT NULL,
  "billing_cycle" text DEFAULT 'monthly' NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "price" integer DEFAULT 0 NOT NULL,
  "currency" text DEFAULT 'IDR' NOT NULL,
  "renewal_date" timestamp,
  "next_plan_name" text DEFAULT 'free' NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "billing_subscriptions_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "billing_subscriptions_user_id_unique" UNIQUE("user_id")
);
`));

  await db.execute(sql.raw(`
CREATE INDEX IF NOT EXISTS "billing_subscriptions_user_id_idx"
ON "billing_subscriptions" USING btree ("user_id");
`));

  await db.execute(sql.raw(`
CREATE INDEX IF NOT EXISTS "billing_subscriptions_status_idx"
ON "billing_subscriptions" USING btree ("status");
`));

  await db.execute(sql.raw(`
CREATE TABLE IF NOT EXISTS "billing_transactions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL,
  "subscription_id" text,
  "invoice_id" text NOT NULL,
  "plan_name" text DEFAULT 'free' NOT NULL,
  "billing_cycle" text DEFAULT 'monthly' NOT NULL,
  "amount" integer DEFAULT 0 NOT NULL,
  "currency" text DEFAULT 'IDR' NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "provider" text DEFAULT 'midtrans' NOT NULL,
  "provider_reference" text DEFAULT '' NOT NULL,
  "snap_token" text DEFAULT '' NOT NULL,
  "redirect_url" text DEFAULT '' NOT NULL,
  "payment_method" text DEFAULT '' NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "raw_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "paid_at" timestamp,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "billing_transactions_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE cascade ON UPDATE no action,
  CONSTRAINT "billing_transactions_subscription_id_billing_subscriptions_id_fk"
    FOREIGN KEY ("subscription_id") REFERENCES "public"."billing_subscriptions"("id")
    ON DELETE set null ON UPDATE no action,
  CONSTRAINT "billing_transactions_invoice_id_unique" UNIQUE("invoice_id")
);
`));

  await db.execute(sql.raw(`
CREATE INDEX IF NOT EXISTS "billing_transactions_user_id_idx"
ON "billing_transactions" USING btree ("user_id");
`));

  await db.execute(sql.raw(`
CREATE INDEX IF NOT EXISTS "billing_transactions_invoice_id_idx"
ON "billing_transactions" USING btree ("invoice_id");
`));

  await db.execute(sql.raw(`
CREATE INDEX IF NOT EXISTS "billing_transactions_status_idx"
ON "billing_transactions" USING btree ("status");
`));

  await db.execute(sql.raw(`
INSERT INTO "creator_settings" ("user_id", "billing_email")
SELECT u.id, COALESCE(NULLIF(u.contact_email, ''), u.email, '')
FROM "users" u
ON CONFLICT ("user_id") DO NOTHING;
`));

  await db.execute(sql.raw(`
INSERT INTO "billing_subscriptions" (
  "id",
  "user_id",
  "plan_name",
  "billing_cycle",
  "status",
  "price",
  "currency",
  "next_plan_name"
)
SELECT
  md5(u.id::text || '-subscription'),
  u.id,
  'free',
  'monthly',
  'active',
  0,
  'IDR',
  'free'
FROM "users" u
ON CONFLICT ("user_id") DO NOTHING;
`));

  await db.execute(sql.raw(`
UPDATE "billing_subscriptions"
SET "plan_name" = 'creator'
WHERE "plan_name" = 'pro';

UPDATE "billing_subscriptions"
SET "next_plan_name" = 'creator'
WHERE "next_plan_name" = 'pro';

UPDATE "billing_transactions"
SET "plan_name" = 'creator'
WHERE "plan_name" = 'pro';
`));

  await db.execute(sql.raw(`
CREATE INDEX IF NOT EXISTS "videos_user_source_visibility_idx"
ON "videos" USING btree ("user_id", "source", "visibility");
`));
}

export async function ensureBillingSchema() {
  if (!isDatabaseConfigured) {
    return;
  }

  if (!ensurePromise) {
    ensurePromise = runBillingSchemaBootstrap().catch((error) => {
      ensurePromise = null;
      throw error;
    });
  }

  await ensurePromise;
}
