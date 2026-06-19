import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditScans } from "@/db/schema";
import { triggerAuditSchema } from "@/lib/audit-schemas";
import { runAuditScan } from "@/server/audit-engine";
import { getLatestAuditSummary } from "@/server/audit-reporter";
import { requireAdminSession } from "@/server/admin-guard";

/** Full audit crawls multiple routes + APIs; 60s matches Vercel Hobby max (was 30s for all API routes). */
export const maxDuration = 60;

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [summary, scans] = await Promise.all([
    getLatestAuditSummary(),
    db.query.auditScans.findMany({ orderBy: desc(auditScans.createdAt), limit: 20 }),
  ]);

  return NextResponse.json({ summary, scans });
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminSession();
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const parsed = triggerAuditSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Payload audit tidak valid." }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const result = await runAuditScan({
      ...parsed.data,
      targetUrl: parsed.data.targetUrl ?? origin,
      triggerType: "manual",
      createdBy: admin.id,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan saat menjalankan audit.";
    console.error("[api/admin/audit] POST failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
