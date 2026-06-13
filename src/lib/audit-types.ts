export type AuditSeverity = "low" | "medium" | "high" | "critical";
export type AuditCategory =
  | "frontend"
  | "backend"
  | "database"
  | "api"
  | "auth"
  | "storage"
  | "seo"
  | "security"
  | "performance"
  | "config"
  | "routes"
  | "deployment"
  | "monitoring";

export type AuditScanStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type AuditTriggerType = "manual" | "cron" | "deploy";

export type AuditFindingInput = {
  category: AuditCategory;
  severity: AuditSeverity;
  code: string;
  title: string;
  description?: string;
  routeOrEndpoint?: string;
  evidence?: Record<string, unknown>;
  recommendation?: string;
};

export type AuditFindingSummary = Record<AuditSeverity, number>;

export type AuditReportSummary = {
  score: number;
  statusLabel: string;
  counts: AuditFindingSummary;
  totalFindings: number;
  categories: Record<string, number>;
};
