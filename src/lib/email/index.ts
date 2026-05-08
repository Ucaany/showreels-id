/**
 * Email module barrel export.
 * Import from "@/lib/email" for all email functionality.
 */
export { queueEmail, processEmailQueue, sendEmailDirect, getEmailStats, getQueueStatus } from "./email-service";
export { getResendClient, EMAIL_FROM, isEmailConfigured } from "./resend-client";
export { renderEmailTemplate, type EmailType, type EmailTemplateData } from "./email-templates";
