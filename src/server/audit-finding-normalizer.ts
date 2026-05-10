import type { AuditFindingInput } from "@/lib/audit-types";

export function normalizeAuditFinding(input: AuditFindingInput) {
  const routeOrEndpoint = input.routeOrEndpoint || "global";
  const fingerprint = [input.category, input.severity, input.code, routeOrEndpoint]
    .join(":")
    .toLowerCase()
    .replace(/\s+/g, "-");

  return {
    category: input.category,
    severity: input.severity,
    code: input.code,
    title: input.title,
    description: input.description || "",
    routeOrEndpoint,
    evidenceJson: input.evidence || {},
    recommendation: input.recommendation || "Review detail evidence dan lakukan perbaikan sesuai prioritas severity.",
    fingerprint,
  };
}
