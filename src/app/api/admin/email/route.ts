import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/server/current-user";
import { isAdminEmail } from "@/server/admin-access";
import { getEmailStats, getQueueStatus, getDailyQuota } from "@/lib/email";
import { getSiteSettings, updateSiteSettings } from "@/server/site-settings";
import { db, isDatabaseConfigured } from "@/db";
import { emailLogs } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

/**
 * GET /api/admin/email - Get email system status, stats, and recent logs
 */
export async function GET() {
  const user = await requireCurrentUser();
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const [settings, stats, queueStatus, dailyQuota] = await Promise.all([
      getSiteSettings(),
      getEmailStats(),
      getQueueStatus(),
      getDailyQuota(),
    ]);

    // Get recent email logs (last 50)
    let recentLogs: Array<Record<string, unknown>> = [];
    if (isDatabaseConfigured) {
      recentLogs = await db
        .select()
        .from(emailLogs)
        .orderBy(desc(emailLogs.createdAt))
        .limit(50);
    }

    return NextResponse.json({
      emailEnabled: settings.emailEnabled,
      dailyQuota,
      stats,
      queueStatus,
      recentLogs,
    });
  } catch (error) {
    console.error("[Admin Email] Error fetching email data:", error);
    return NextResponse.json(
      { error: "Failed to fetch email data" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/email - Toggle email system on/off (kill-switch)
 */
export async function PATCH(request: Request) {
  const user = await requireCurrentUser();
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { emailEnabled } = body as { emailEnabled?: boolean };

    if (typeof emailEnabled !== "boolean") {
      return NextResponse.json(
        { error: "emailEnabled must be a boolean" },
        { status: 400 }
      );
    }

    const updated = await updateSiteSettings({ emailEnabled });

    return NextResponse.json({
      ok: true,
      emailEnabled: updated?.emailEnabled ?? emailEnabled,
    });
  } catch (error) {
    console.error("[Admin Email] Error updating email settings:", error);
    return NextResponse.json(
      { error: "Failed to update email settings" },
      { status: 500 }
    );
  }
}
