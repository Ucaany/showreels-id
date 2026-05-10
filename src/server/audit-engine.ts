import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditApiChecks, auditFindings, auditRouteChecks, auditScans, systemHealthHistory } from "@/db/schema";
import { calculateAuditScore, EMPTY_AUDIT_COUNTS, getAuditStatusLabel } from "@/lib/audit-score";
import type { AuditFindingInput, AuditSeverity, AuditTriggerType } from "@/lib/audit-types";
import { crawlRoutes } from "@/server/crawler/route-crawler";
import { validateDatabaseIntegrity } from "@/server/database/db-validator";
import { normalizeAuditFinding } from "@/server/audit-finding-normalizer";
import { validateApiEndpoints } from "@/server/validators/api-validator";
import { validateRuntimeConfig } from "@/server/validators/config-validator";

function getDefaultBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` ||
    "http://localhost:3000"
  );
}

function countFindings(findings: AuditFindingInput[]) {
  const counts = { ...EMPTY_AUDIT_COUNTS };
  for (const finding of findings) counts[finding.severity as AuditSeverity] += 1;
  return counts;
}

export async function runAuditScan(input: {
  targetUrl?: string;
  scope?: string;
  triggerType?: AuditTriggerType;
  createdBy?: string | null;
}) {
  const targetUrl = input.targetUrl || getDefaultBaseUrl();
  const scope = input.scope || "full";
  const startedAt = new Date();

  const [scan] = await db
    .insert(auditScans)
    .values({
      targetUrl,
      scope,
      triggerType: input.triggerType || "manual",
      status: "running",
      startedAt,
      createdBy: input.createdBy || null,
    })
    .returning();

  try {
    const allFindings: AuditFindingInput[] = [];
    let routeChecks: Awaited<ReturnType<typeof crawlRoutes>>["checks"] = [];
    let apiChecks: Awaited<ReturnType<typeof validateApiEndpoints>>["checks"] = [];

    if (scope === "full" || scope === "routes" || scope === "seo") {
      const routeResult = await crawlRoutes(targetUrl);
      routeChecks = routeResult.checks;
      allFindings.push(...routeResult.findings);
    }

    if (scope === "full" || scope === "api") {
      const apiResult = await validateApiEndpoints(targetUrl);
      apiChecks = apiResult.checks;
      allFindings.push(...apiResult.findings);
    }

    if (scope === "full" || scope === "database") {
      allFindings.push(...await validateDatabaseIntegrity());
    }

    if (scope === "full" || scope === "config") {
      allFindings.push(...validateRuntimeConfig());
    }

    const counts = countFindings(allFindings);
    const score = calculateAuditScore(counts);
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    await db.transaction(async (tx) => {
      if (routeChecks.length) {
        await tx.insert(auditRouteChecks).values(routeChecks.map((check) => ({ scanId: scan.id, ...check })));
      }
      if (apiChecks.length) {
        await tx.insert(auditApiChecks).values(apiChecks.map((check) => ({ scanId: scan.id, ...check })));
      }
      if (allFindings.length) {
        await tx.insert(auditFindings).values(allFindings.map((finding) => ({ scanId: scan.id, ...normalizeAuditFinding(finding) })));
      }
      await tx.insert(systemHealthHistory).values({
        scanId: scan.id,
        healthScore: score,
        criticalCount: counts.critical,
        highCount: counts.high,
        mediumCount: counts.medium,
        lowCount: counts.low,
      });
      await tx
        .update(auditScans)
        .set({
          status: "completed",
          finishedAt,
          durationMs,
          healthScore: score,
          lowCount: counts.low,
          mediumCount: counts.medium,
          highCount: counts.high,
          criticalCount: counts.critical,
          summaryJson: {
            statusLabel: getAuditStatusLabel(score),
            totalFindings: allFindings.length,
            routeChecks: routeChecks.length,
            apiChecks: apiChecks.length,
          },
          updatedAt: finishedAt,
        })
        .where(eq(auditScans.id, scan.id));
    });

    return { scanId: scan.id, score, counts, totalFindings: allFindings.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Audit scan failed";
    await db.update(auditScans).set({ status: "failed", errorMessage: message, finishedAt: new Date(), updatedAt: new Date() }).where(eq(auditScans.id, scan.id));
    throw error;
  }
}
