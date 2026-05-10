import type { AuditFindingInput } from "@/lib/audit-types";
import { API_ENDPOINT_CATALOG } from "@/server/validators/api-endpoint-catalog";

export type ApiCheckResult = {
  endpoint: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  ok: boolean;
  errorMessage?: string;
};

export async function validateApiEndpoints(baseUrl: string) {
  const checks: ApiCheckResult[] = [];
  const findings: AuditFindingInput[] = [];

  for (const item of API_ENDPOINT_CATALOG) {
    const startedAt = performance.now();
    try {
      const response = await fetch(new URL(item.endpoint, baseUrl), {
        method: item.method,
        cache: "no-store",
      });
      const latencyMs = Math.round(performance.now() - startedAt);
      await response.text().catch(() => "");
      const ok = item.expectedStatuses.includes(response.status);
      checks.push({ endpoint: item.endpoint, method: item.method, statusCode: response.status, latencyMs, ok });

      if (!ok) {
        findings.push({
          category: "api",
          severity: response.status >= 500 ? "critical" : "high",
          code: "API_UNEXPECTED_STATUS",
          title: `${item.method} ${item.endpoint} status tidak sesuai`,
          routeOrEndpoint: item.endpoint,
          evidence: { statusCode: response.status, expectedStatuses: item.expectedStatuses, latencyMs },
          recommendation: "Periksa handler API, auth guard, dan kontrak response endpoint.",
        });
      }

      if (latencyMs > 2500) {
        findings.push({ category: "performance", severity: "medium", code: "SLOW_API", title: `${item.endpoint} lambat`, routeOrEndpoint: item.endpoint, evidence: { latencyMs } });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown API validation error";
      checks.push({ endpoint: item.endpoint, method: item.method, statusCode: 0, latencyMs: Math.round(performance.now() - startedAt), ok: false, errorMessage: message });
      findings.push({ category: "api", severity: "critical", code: "API_FETCH_FAILED", title: `${item.endpoint} gagal diakses`, routeOrEndpoint: item.endpoint, description: message, evidence: { error: message } });
    }
  }

  return { checks, findings };
}
