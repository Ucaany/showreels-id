import { and, eq, lte } from "drizzle-orm";

import { db, isDatabaseConfigured } from "@/db";
import { billingSubscriptions } from "@/db/schema";

/**
 * Cron job untuk mengecek dan menurunkan trial yang sudah expired.
 * Jalankan setiap hari pada jam 00:00 UTC.
 */
export async function handleExpiredTrials() {
  if (!isDatabaseConfigured) {
    console.log("Database not configured, skipping trial expiry check");
    return { processed: 0, errors: 0, total: 0 };
  }

  try {
    const now = new Date();

    const expiredTrials = await db.query.billingSubscriptions.findMany({
      where: and(
        eq(billingSubscriptions.status, "trial"),
        lte(billingSubscriptions.renewalDate, now)
      ),
    });

    console.log(`Found ${expiredTrials.length} expired trials to process`);

    let processed = 0;
    let errors = 0;

    for (const subscription of expiredTrials) {
      try {
        await db
          .update(billingSubscriptions)
          .set({
            planName: "free",
            status: "active",
            price: 0,
            nextPlanName: "free",
            renewalDate: null,
            updatedAt: new Date(),
          })
          .where(eq(billingSubscriptions.id, subscription.id));

        processed++;
        console.log(`Downgraded trial to free for user: ${subscription.userId}`);
      } catch (error) {
        errors++;
        console.error(
          `Failed to downgrade trial for user ${subscription.userId}:`,
          error
        );
      }
    }

    return { processed, errors, total: expiredTrials.length };
  } catch (error) {
    console.error("Error in handleExpiredTrials:", error);
    throw error;
  }
}
