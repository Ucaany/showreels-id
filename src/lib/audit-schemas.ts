import { z } from "zod";

export const triggerAuditSchema = z.object({
  targetUrl: z.url().optional(),
  scope: z.enum(["full", "api", "routes", "database", "seo", "config"]).default("full"),
});

export const findingStatusSchema = z.object({
  status: z.enum(["open", "resolved", "ignored"]),
});
