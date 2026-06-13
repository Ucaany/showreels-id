import { eq, sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { siteSettings, type DbSiteSettings } from "@/db/schema";

export const SITE_SETTINGS_ID = "global";

let billingColumnEnsured = false;
let emailColumnEnsured = false;

async function ensureBillingEnabledColumn() {
  if (billingColumnEnsured) return;
  try {
    await db.execute(sql.raw(
      `ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "billing_enabled" boolean NOT NULL DEFAULT true;`
    ));
    // Ensure existing rows have billing enabled
    await db.execute(sql.raw(
      `UPDATE "site_settings" SET "billing_enabled" = true WHERE "id" = 'global' AND "billing_enabled" = false;`
    ));
    billingColumnEnsured = true;
  } catch {
    // Column likely already exists or table doesn't exist yet
    billingColumnEnsured = true;
  }
}

async function ensureEmailEnabledColumn() {
  if (emailColumnEnsured) return;
  try {
    await db.execute(sql.raw(
      `ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "email_enabled" boolean NOT NULL DEFAULT true;`
    ));
    emailColumnEnsured = true;
  } catch {
    // Column likely already exists or table doesn't exist yet
    emailColumnEnsured = true;
  }
}

let defaultPaymentMethodColumnEnsured = false;

async function ensureDefaultPaymentMethodColumn() {
  if (defaultPaymentMethodColumnEnsured) return;
  try {
    await db.execute(sql.raw(
      `ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "default_payment_method" text NOT NULL DEFAULT 'bayar_gg';`
    ));
    defaultPaymentMethodColumnEnsured = true;
  } catch {
    defaultPaymentMethodColumnEnsured = true;
  }
}

const SITE_SETTINGS_DEFAULTS: DbSiteSettings = {
  id: SITE_SETTINGS_ID,
  maintenanceEnabled: false,
  pauseEnabled: false,
  maintenanceMessage:
    "Website sedang dalam maintenance sementara. Silakan kembali beberapa saat lagi.",
  billingEnabled: false,
  emailEnabled: true,
  defaultPaymentMethod: "bayar_gg",
  updatedAt: new Date(),
};

export async function getSiteSettings(): Promise<DbSiteSettings> {
  if (!isDatabaseConfigured) {
    return { ...SITE_SETTINGS_DEFAULTS };
  }

  try {
    await ensureBillingEnabledColumn();
    await ensureEmailEnabledColumn();
    await ensureDefaultPaymentMethodColumn();

    const existing = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.id, SITE_SETTINGS_ID),
    });

    if (existing) {
      return existing;
    }

    const [created] = await db
      .insert(siteSettings)
      .values({ id: SITE_SETTINGS_ID })
      .onConflictDoNothing()
      .returning();

    if (created) {
      return created;
    }

    const fallback = await db.query.siteSettings.findFirst({
      where: eq(siteSettings.id, SITE_SETTINGS_ID),
    });

    if (!fallback) {
      console.error("site_settings_init_failed: returning defaults");
      return { ...SITE_SETTINGS_DEFAULTS };
    }

    return fallback;
  } catch (error) {
    console.error("getSiteSettings_db_error", error);
    return { ...SITE_SETTINGS_DEFAULTS };
  }
}

export async function updateSiteSettings(input: {
  maintenanceEnabled?: boolean;
  pauseEnabled?: boolean;
  maintenanceMessage?: string;
  billingEnabled?: boolean;
  emailEnabled?: boolean;
  defaultPaymentMethod?: string;
}) {
  if (!isDatabaseConfigured) {
    return {
      id: SITE_SETTINGS_ID,
      maintenanceEnabled: input.maintenanceEnabled ?? false,
      pauseEnabled: input.pauseEnabled ?? false,
      maintenanceMessage:
        input.maintenanceMessage ||
        "Website sedang dalam maintenance sementara. Silakan kembali beberapa saat lagi.",
      billingEnabled: input.billingEnabled ?? false,
      emailEnabled: input.emailEnabled ?? true,
      defaultPaymentMethod: input.defaultPaymentMethod ?? "bayar_gg",
      updatedAt: new Date(),
    };
  }

  await getSiteSettings();

  const [updated] = await db
    .update(siteSettings)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(siteSettings.id, SITE_SETTINGS_ID))
    .returning();

  return updated;
}
