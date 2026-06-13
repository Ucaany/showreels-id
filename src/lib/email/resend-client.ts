/**
 * Resend email client configuration.
 * Provides a singleton Resend instance for sending emails.
 */
import { Resend } from "resend";

let resendInstance: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY environment variable is not set. Email sending is disabled."
      );
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

/**
 * Default sender configuration.
 */
export const EMAIL_FROM =
  process.env.EMAIL_FROM || "Showreels.id <noreply@showreels.id>";

/**
 * Check if email sending is configured (API key exists).
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
