import { NextResponse } from "next/server";
import { processEmailQueue } from "@/lib/email";

/**
 * Cron endpoint untuk memproses email queue.
 * Vercel Cron akan hit endpoint ini setiap menit.
 * Processes up to 10 pending emails per invocation.
 */
export async function GET(request: Request) {
  // Verifikasi cron secret untuk keamanan
  const authHeader = request.headers.get("authorization");
  const cronSecret = (process.env.CRON_SECRET || "").trim();

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processEmailQueue(10);

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} email jobs: ${result.sent} sent, ${result.failed} failed, ${result.retried} retried`,
      ...result,
    });
  } catch (error) {
    console.error("Email queue cron job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
