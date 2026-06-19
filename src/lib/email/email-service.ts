/**
 * Email Service - Core email sending and queueing logic.
 * 
 * Design principles:
 * - Email NEVER blocks transactions (fire-and-forget pattern)
 * - Database-based queue for reliability
 * - Admin kill-switch via site_settings.email_enabled
 * - Graceful degradation when Resend is unavailable
 */
import { db, isDatabaseConfigured } from "@/db";
import { emailLogs, emailQueueJobs } from "@/db/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { getResendClient, EMAIL_FROM, isEmailConfigured } from "./resend-client";
import { renderEmailTemplate, type EmailTemplateData } from "./email-templates";
import { getSiteSettings } from "@/server/site-settings";
import { rateLimiters } from "@/lib/rate-limit";

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [60_000, 300_000, 900_000]; // 1min, 5min, 15min

export interface QueueEmailOptions {
  userId?: string;
  recipientEmail: string;
  template: EmailTemplateData;
}

/**
 * Queue an email for sending. This is the primary API for sending emails.
 * NEVER throws - always returns silently on failure.
 * 
 * Usage: `void queueEmail({ ... })` — fire and forget after transaction commit.
 */
export async function queueEmail(options: QueueEmailOptions): Promise<void> {
  try {
    if (!isDatabaseConfigured) {
      console.warn("[email] Database not configured, skipping email queue");
      return;
    }

    // Check kill-switch
    const settings = await getSiteSettings();
    if (!settings.emailEnabled) {
      console.info("[email] Email disabled via admin kill-switch, skipping");
      // Log as skipped
      await db.insert(emailLogs).values({
        userId: options.userId ?? null,
        emailType: options.template.type,
        recipientEmail: options.recipientEmail,
        status: "skipped",
        provider: "resend",
        errorMessage: "Email disabled via admin kill-switch",
      });
      return;
    }

    // Strategy: Direct send first, queue as fallback for retries
    // This ensures emails are sent immediately without waiting for cron
    const directResult = await sendEmailDirect(options);

    if (directResult.success) {
      // Log success directly
      await db.insert(emailLogs).values({
        userId: options.userId ?? null,
        emailType: options.template.type,
        recipientEmail: options.recipientEmail,
        status: "sent",
        provider: "resend",
        messageId: directResult.messageId ?? null,
      });
      return;
    }

    // Direct send failed — queue for retry via cron
    console.warn("[email] Direct send failed, queueing for retry:", directResult.error);
    await db.insert(emailQueueJobs).values({
      payload: {
        userId: options.userId,
        recipientEmail: options.recipientEmail,
        templateType: options.template.type,
        templateData: options.template.data,
      } as Record<string, unknown>,
      status: "pending",
    });
  } catch (error) {
    // NEVER throw from email queueing - log and move on
    console.error("[email] Failed to queue email (non-blocking):", error);
  }
}

/**
 * Send an email directly (bypasses queue).
 * Used by the queue worker to actually send emails.
 */
export async function sendEmailDirect(options: QueueEmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    if (!isEmailConfigured()) {
      return { success: false, error: "Resend API key not configured" };
    }

    // Rate limit check
    const rateLimit = rateLimiters.emailSend("global");
    if (!rateLimit.success) {
      return { success: false, error: "Rate limit exceeded for email sending" };
    }

    const { subject, html } = renderEmailTemplate(options.template);
    const resend = getResendClient();

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: options.recipientEmail,
      subject,
      html,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Process pending email queue jobs.
 * Called by the cron worker endpoint.
 * 
 * @param batchSize - Number of jobs to process per run (default: 10)
 * @returns Summary of processed jobs
 */
export async function processEmailQueue(batchSize = 10): Promise<{
  processed: number;
  sent: number;
  failed: number;
  retried: number;
}> {
  if (!isDatabaseConfigured) {
    return { processed: 0, sent: 0, failed: 0, retried: 0 };
  }

  const now = new Date();
  const stats = { processed: 0, sent: 0, failed: 0, retried: 0 };

  // Fetch pending jobs (either new or ready for retry)
  const jobs = await db
    .select()
    .from(emailQueueJobs)
    .where(
      and(
        eq(emailQueueJobs.status, "pending"),
        // Only pick jobs where nextRetryAt is null (new) or in the past (ready for retry)
        sql`(${emailQueueJobs.nextRetryAt} IS NULL OR ${emailQueueJobs.nextRetryAt} <= ${now})`
      )
    )
    .limit(batchSize);

  for (const job of jobs) {
    stats.processed++;

    // Mark as processing
    await db
      .update(emailQueueJobs)
      .set({ status: "processing" })
      .where(eq(emailQueueJobs.id, job.id));

    const payload = job.payload as {
      userId?: string;
      recipientEmail: string;
      templateType: string;
      templateData: Record<string, unknown>;
    };

    const result = await sendEmailDirect({
      userId: payload.userId,
      recipientEmail: payload.recipientEmail,
      template: {
        type: payload.templateType,
        data: payload.templateData,
      } as unknown as EmailTemplateData,
    });

    if (result.success) {
      // Mark job as completed
      await db
        .update(emailQueueJobs)
        .set({ status: "completed", processedAt: new Date() })
        .where(eq(emailQueueJobs.id, job.id));

      // Log success
      await db.insert(emailLogs).values({
        userId: payload.userId ?? null,
        emailType: payload.templateType,
        recipientEmail: payload.recipientEmail,
        status: "sent",
        provider: "resend",
        messageId: result.messageId ?? null,
      });

      stats.sent++;
    } else {
      // Handle failure with retry logic
      const newRetryCount = job.retryCount + 1;

      if (newRetryCount >= MAX_RETRIES) {
        // Max retries reached - mark as failed permanently
        await db
          .update(emailQueueJobs)
          .set({
            status: "failed",
            lastError: result.error ?? "Unknown error",
            retryCount: newRetryCount,
            processedAt: new Date(),
          })
          .where(eq(emailQueueJobs.id, job.id));

        // Log failure
        await db.insert(emailLogs).values({
          userId: payload.userId ?? null,
          emailType: payload.templateType,
          recipientEmail: payload.recipientEmail,
          status: "failed",
          provider: "resend",
          errorMessage: result.error ?? "Max retries exceeded",
        });

        stats.failed++;
      } else {
        // Schedule retry with exponential backoff
        const delayMs = RETRY_DELAYS_MS[newRetryCount - 1] || RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
        const nextRetryAt = new Date(Date.now() + delayMs);

        await db
          .update(emailQueueJobs)
          .set({
            status: "pending",
            lastError: result.error ?? "Unknown error",
            retryCount: newRetryCount,
            nextRetryAt,
          })
          .where(eq(emailQueueJobs.id, job.id));

        stats.retried++;
      }
    }
  }

  return stats;
}

/**
 * Get email statistics for admin dashboard.
 */
export async function getEmailStats() {
  if (!isDatabaseConfigured) {
    return { total: 0, sent: 0, failed: 0, pending: 0, skipped: 0 };
  }

  const [result] = await db
    .select({
      total: sql<number>`count(*)`,
      sent: sql<number>`count(*) filter (where ${emailLogs.status} = 'sent')`,
      failed: sql<number>`count(*) filter (where ${emailLogs.status} = 'failed')`,
      pending: sql<number>`count(*) filter (where ${emailLogs.status} = 'pending')`,
      skipped: sql<number>`count(*) filter (where ${emailLogs.status} = 'skipped')`,
    })
    .from(emailLogs);

  return result ?? { total: 0, sent: 0, failed: 0, pending: 0, skipped: 0 };
}

/**
 * Get daily email quota usage.
 * Resend free tier = 100 emails/day, configurable via RESEND_DAILY_LIMIT env.
 */
export async function getDailyQuota() {
  const dailyLimit = parseInt(process.env.RESEND_DAILY_LIMIT || "100", 10);

  if (!isDatabaseConfigured) {
    return { used: 0, limit: dailyLimit, remaining: dailyLimit, percentage: 0 };
  }

  // Count emails sent today (status = 'sent')
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [result] = await db
    .select({
      used: sql<number>`count(*) filter (where ${emailLogs.status} = 'sent' and ${emailLogs.createdAt} >= ${todayStart.toISOString()}::timestamp)`,
    })
    .from(emailLogs);

  const used = Number(result?.used ?? 0);
  const remaining = Math.max(0, dailyLimit - used);
  const percentage = Math.round((used / dailyLimit) * 100);

  return { used, limit: dailyLimit, remaining, percentage };
}

/**
 * Get queue status for monitoring.
 */
export async function getQueueStatus() {
  if (!isDatabaseConfigured) {
    return { pending: 0, processing: 0, completed: 0, failed: 0 };
  }

  const [result] = await db
    .select({
      pending: sql<number>`count(*) filter (where ${emailQueueJobs.status} = 'pending')`,
      processing: sql<number>`count(*) filter (where ${emailQueueJobs.status} = 'processing')`,
      completed: sql<number>`count(*) filter (where ${emailQueueJobs.status} = 'completed')`,
      failed: sql<number>`count(*) filter (where ${emailQueueJobs.status} = 'failed')`,
    })
    .from(emailQueueJobs);

  return result ?? { pending: 0, processing: 0, completed: 0, failed: 0 };
}
