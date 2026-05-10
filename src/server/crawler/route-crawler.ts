import type { AuditFindingInput } from "@/lib/audit-types";

export type RouteCheckResult = {
  route: string;
  statusCode: number;
  loadTimeMs: number;
  payloadBytes: number;
  hasTitle: boolean;
  hasMetaDescription: boolean;
  errorMessage?: string;
};

const DEFAULT_ROUTES = ["/", "/auth/login", "/dashboard", "/admin", "/api/site-status"];

function hasTag(html: string, pattern: RegExp) {
  return pattern.test(html);
}

export async function crawlRoutes(baseUrl: string, routes = DEFAULT_ROUTES) {
  const checks: RouteCheckResult[] = [];
  const findings: AuditFindingInput[] = [];

  for (const route of routes) {
    const startedAt = performance.now();
    const url = new URL(route, baseUrl).toString();

    try {
      const response = await fetch(url, { cache: "no-store", redirect: "manual" });
      const text = await response.text().catch(() => "");
      const loadTimeMs = Math.round(performance.now() - startedAt);
      const payloadBytes = new TextEncoder().encode(text).length;
      const hasTitle = hasTag(text, /<title[^>]*>[^<]{3,}<\/title>/i);
      const hasMetaDescription = hasTag(text, /<meta[^>]+name=["']description["'][^>]+content=["'][^"']{20,}/i);

      checks.push({
        route,
        statusCode: response.status,
        loadTimeMs,
        payloadBytes,
        hasTitle,
        hasMetaDescription,
      });

      if (response.status >= 500) {
        findings.push({
          category: "routes",
          severity: "critical",
          code: "ROUTE_5XX",
          title: `Route ${route} mengembalikan ${response.status}`,
          routeOrEndpoint: route,
          evidence: { statusCode: response.status, loadTimeMs },
          recommendation: "Periksa server log dan dependency route ini.",
        });
      } else if (response.status === 404) {
        findings.push({
          category: "routes",
          severity: "high",
          code: "ROUTE_404",
          title: `Route ${route} tidak ditemukan`,
          routeOrEndpoint: route,
          evidence: { statusCode: response.status },
          recommendation: "Pastikan route masih valid atau hapus dari sitemap/navigation.",
        });
      }

      if (response.ok && route !== "/api/site-status") {
        if (!hasTitle) {
          findings.push({ category: "seo", severity: "medium", code: "SEO_MISSING_TITLE", title: `Title tag hilang di ${route}`, routeOrEndpoint: route });
        }
        if (!hasMetaDescription) {
          findings.push({ category: "seo", severity: "low", code: "SEO_MISSING_DESCRIPTION", title: `Meta description hilang di ${route}`, routeOrEndpoint: route });
        }
      }

      if (loadTimeMs > 3000) {
        findings.push({ category: "performance", severity: "medium", code: "SLOW_ROUTE", title: `Route ${route} lambat`, routeOrEndpoint: route, evidence: { loadTimeMs }, recommendation: "Optimalkan query, caching, dan payload route." });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown route crawl error";
      checks.push({ route, statusCode: 0, loadTimeMs: Math.round(performance.now() - startedAt), payloadBytes: 0, hasTitle: false, hasMetaDescription: false, errorMessage: message });
      findings.push({ category: "routes", severity: "critical", code: "ROUTE_FETCH_FAILED", title: `Route ${route} gagal diakses`, routeOrEndpoint: route, description: message, evidence: { error: message } });
    }
  }

  return { checks, findings };
}
