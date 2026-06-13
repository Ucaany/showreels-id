const DEFAULT_OWNER_EMAIL = "hello@ucan.com";

export function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || process.env.admin_emails || "";
  const ownerEmail = (process.env.OWNER_EMAIL || DEFAULT_OWNER_EMAIL).trim().toLowerCase();
  const emails = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (ownerEmail) {
    emails.push(ownerEmail);
  }

  return new Set(emails);
}

export function getAdminEmailList() {
  return Array.from(getAdminEmails());
}

export function isAdminConfigured() {
  return getAdminEmails().size > 0;
}

export function isAdminEmail(email?: string | null) {
  const normalizedEmail = (email || "").trim().toLowerCase();
  const adminEmails = getAdminEmails();

  if (!adminEmails.size || !normalizedEmail) return false;

  return adminEmails.has(normalizedEmail);
}

export function isProtectedOwnerTarget(input: {
  email?: string | null;
  role?: string | null;
}) {
  return input.role === "owner" || isAdminEmail(input.email);
}
