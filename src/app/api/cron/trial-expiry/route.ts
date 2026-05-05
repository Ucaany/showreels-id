import { NextResponse } from "next/server";

import { handleExpiredTrials } from "@/server/trial-expiry-handler";

/**
 * Cron endpoint untuk menangani trial yang expired.
 * Vercel Cron atau external cron service akan hit endpoint ini setiap hari.
 */
export async function GET(request: Request) {
  // Verifikasi cron secret untuk keamanan
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || "your-secret-key";

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await handleExpiredTrials();

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} expired trials`,
      ...result,
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
