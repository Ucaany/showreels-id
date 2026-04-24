import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { siteSettings, type DbSiteSettings } from "@/db/schema";

export const SITE_SETTINGS_ID = "global";

export async function getSiteSettings(): Promise<DbSiteSettings> {
  if (!isDatabaseConfigured) {
    return {
      id: SITE_SETTINGS_ID,
      maintenanceEnabled: false,
      pauseEnabled: false,
      maintenanceMessage:
        "Website sedang dalam maintenance sementara. Silakan kembali beberapa saat lagi.",
      updatedAt: new Date(),
    };
  }

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
    throw new Error("Site settings could not be initialized.");
  }

  return fallback;
}

export async function updateSiteSettings(input: {
  maintenanceEnabled?: boolean;
  pauseEnabled?: boolean;
  maintenanceMessage?: string;
}) {
  if (!isDatabaseConfigured) {
    return {
      id: SITE_SETTINGS_ID,
      maintenanceEnabled: input.maintenanceEnabled ?? false,
      pauseEnabled: input.pauseEnabled ?? false,
      maintenanceMessage:
        input.maintenanceMessage ||
        "Website sedang dalam maintenance sementara. Silakan kembali beberapa saat lagi.",
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
