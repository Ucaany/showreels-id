import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { auditFindings, auditScans } from "@/db/schema";
import { getAuditStatusLabel } from "@/lib/audit-score";

export async function getLatestAuditSummary() {
  const latest = await db.query.auditScans.findFirst({
    orderBy: desc(auditScans.createdAt),
  });

  if (!latest) {
    return {
      latestScan: null,
      counts: { critical: 0, high: 0, medium: 0, low: 0 },
      score: 100,
      statusLabel: "Not Scanned",
      findings: [],
    };
  }

  const findings = await db.query.auditFindings.findMany({
    where: eq(auditFindings.scanId, latest.id),
    orderBy: desc(auditFindings.createdAt),
    limit: 20,
  });

  return {
    latestScan: latest,
    counts: {
      critical: latest.criticalCount,
      high: latest.highCount,
      medium: latest.mediumCount,
      low: latest.lowCount,
    },
    score: latest.healthScore,
    statusLabel: getAuditStatusLabel(latest.healthScore),
    findings,
  };
}
