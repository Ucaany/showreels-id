export const PUBLIC_RESERVED_SLUGS = new Set([
  "dashboard",
  "login",
  "register",
  "pricing",
  "settings",
  "admin",
  "api",
  "show",
  "help",
  "terms",
  "privacy",
  "billing",
  "creator",
  "profile",
  "auth",
  "about",
  "legal",
  "videos",
  "v",
  "customer-service",
  "onboarding",
  "payment",
  "favicon.ico",
]);

export function normalizePublicSlug(value: string) {
  return decodeURIComponent(value || "").trim().toLowerCase();
}

export function isReservedPublicSlug(value: string) {
  return PUBLIC_RESERVED_SLUGS.has(normalizePublicSlug(value));
}

export function getCreatorBioHref(username: string) {
  return `/${encodeURIComponent(username)}`;
}

export function getCreatorPortfolioHref(username: string) {
  return `/${encodeURIComponent(username)}/show`;
}

export function getVideoDetailHref(slug: string) {
  return `/${encodeURIComponent(slug)}`;
}

export function createTextExcerpt(value: string | null | undefined, limit: number) {
  const plain = (value || "").replace(/\s+/g, " ").trim();
  if (!plain) {
    return "";
  }

  if (plain.length <= limit) {
    return plain;
  }

  return `${plain.slice(0, Math.max(0, limit - 3)).trim()}...`;
}

export function getSafeExternalUrl(value: string | null | undefined) {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("mailto:") || trimmed.startsWith("tel:")) {
    return trimmed;
  }

  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}
