export const RESERVED_USERNAMES = new Set([
  "admin",
  "dashboard",
  "billing",
  "api",
  "login",
  "register",
]);

export const USERNAME_REGEX = /^[a-z0-9_-]{3,30}$/;

export function sanitizeUsername(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/_+/g, "_")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 30);
}

export function isReservedUsername(input: string): boolean {
  return RESERVED_USERNAMES.has(input.trim().toLowerCase());
}

export function isUsernameFormatValid(input: string): boolean {
  return USERNAME_REGEX.test(input.trim().toLowerCase());
}
