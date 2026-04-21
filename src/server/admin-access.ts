export function getAdminEmails() {
  const raw = process.env.ADMIN_EMAILS || process.env.admin_emails || "";
  const emails = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return new Set(emails);
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
