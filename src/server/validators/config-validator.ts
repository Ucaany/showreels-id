import type { AuditFindingInput } from "@/lib/audit-types";

const REQUIRED_ENV_VARS = ["DATABASE_URL", "AUTH_SECRET", "CRON_SECRET"];

export function validateRuntimeConfig() {
  const findings: AuditFindingInput[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    if (!String(process.env[key] || "").trim()) {
      findings.push({
        category: "config",
        severity: key === "CRON_SECRET" ? "high" : "critical",
        code: "ENV_MISSING",
        title: `${key} belum dikonfigurasi`,
        evidence: { key },
        recommendation: `Tambahkan ${key} ke environment variable deployment dan local .env.`,
      });
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (appUrl) {
    try {
      new URL(appUrl);
    } catch {
      findings.push({ category: "config", severity: "medium", code: "APP_URL_INVALID", title: "APP URL tidak valid", evidence: { appUrl }, recommendation: "Gunakan URL absolut seperti https://showreels.id." });
    }
  }

  return findings;
}
