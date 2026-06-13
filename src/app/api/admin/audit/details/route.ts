import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditApiChecks, auditFindings, auditRouteChecks, auditScans } from "@/db/schema";
import { requireAdminSession } from "@/server/admin-guard";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const latest = await db.query.auditScans.findFirst({ orderBy: desc(auditScans.createdAt) });
  if (!latest) return NextResponse.json({ latestScan: null, routes: [], apis: [], findings: [] });

  const [routes, apis, findings] = await Promise.all([
    db.query.auditRouteChecks.findMany({ where: eq(auditRouteChecks.scanId, latest.id), orderBy: desc(auditRouteChecks.createdAt), limit: 80 }),
    db.query.auditApiChecks.findMany({ where: eq(auditApiChecks.scanId, latest.id), orderBy: desc(auditApiChecks.createdAt), limit: 80 }),
    db.query.auditFindings.findMany({ where: eq(auditFindings.scanId, latest.id), orderBy: desc(auditFindings.createdAt), limit: 80 }),
  ]);

  return NextResponse.json({ latestScan: latest, routes, apis, findings });
}
