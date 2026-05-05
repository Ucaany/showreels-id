import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { creatorSettings } from "@/db/schema";
import { isRelationMissingError } from "@/server/database-errors";

function getFallbackCreatorSettings(input: { userId: string; billingEmail?: string }) {
  return {
    userId: input.userId,
    publicProfile: true,
    searchIndexing: true,
    showPublicEmail: false,
    showSocialLinks: true,
    showPublicStats: false,
    whitelabelEnabled: false,
    billingEmail: input.billingEmail || "",
    paymentMethod: "midtrans",
    taxInfo: "",
    invoiceNotes: "",
    updatedAt: new Date(),
    createdAt: new Date(),
  };
}

export async function getOrCreateCreatorSettings(input: {
  userId: string;
  billingEmail?: string;
}) {
  if (!isDatabaseConfigured) {
    return getFallbackCreatorSettings(input);
  }

  try {
    const existing = await db.query.creatorSettings.findFirst({
      where: eq(creatorSettings.userId, input.userId),
    });
    if (existing) {
      return existing;
    }

    const [created] = await db
      .insert(creatorSettings)
      .values({
        userId: input.userId,
        billingEmail: input.billingEmail || "",
      })
      .returning();

    return created;
  } catch (error) {
    if (isRelationMissingError(error, "creator_settings")) {
      return getFallbackCreatorSettings(input);
    }
    throw error;
  }
}
