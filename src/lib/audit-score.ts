import type { AuditFindingSummary, AuditSeverity } from "@/lib/audit-types";

export const EMPTY_AUDIT_COUNTS: AuditFindingSummary = {
  low: 0,
  medium: 0,
  high: 0,
  critical: 0,
};

export function calculateAuditScore(counts: Partial<Record<AuditSeverity, number>>) {
  const score =
    100 -
    (counts.critical ?? 0) * 10 -
    (counts.high ?? 0) * 5 -
    (counts.medium ?? 0) * 2 -
    (counts.low ?? 0);

  return Math.max(0, Math.min(100, score));
}

export function getAuditStatusLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 50) return "Warning";
  return "Critical";
}
