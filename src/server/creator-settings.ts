import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { creatorSettings } from "@/db/schema";

export async function getOrCreateCreatorSettings(input: {
  userId: string;
  billingEmail?: string;
}) {
  if (!isDatabaseConfigured) {
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
}
