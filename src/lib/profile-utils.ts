import type { Locale } from "@/lib/i18n";

export const MAX_CUSTOM_LINKS = 8;

export interface CustomLinkItem {
  id: string;
  title: string;
  url: string;
  enabled: boolean;
  order: number;
}

export function normalizeSocialUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
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

export function formatBirthDateLabel(value: string, locale: Locale): string {
  if (!value) {
    return locale === "en" ? "Not set" : "Belum diatur";
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return locale === "en" ? "Not set" : "Belum diatur";
  }

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getAgeFromBirthDate(value: string): number | null {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  const dayDiff = today.getDate() - date.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function formatJoinedMonthYear(value: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "id-ID", {
    month: "long",
    year: "numeric",
  }).format(value);
}

export function normalizeCustomLinks(
  value: unknown,
  maxLinks: number = MAX_CUSTOM_LINKS
): CustomLinkItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenIds = new Set<string>();

  const normalized = value
    .map((entry, fallbackIndex) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const source = entry as Record<string, unknown>;
      const title = String(source.title || "").trim().slice(0, 32);
      const url = normalizeSocialUrl(String(source.url || ""));
      if (!title || !url) {
        return null;
      }

      const providedId = String(source.id || "").trim();
      const safeId =
        providedId.length > 0
          ? providedId.slice(0, 80)
          : `custom-link-${fallbackIndex + 1}`;
      const id = seenIds.has(safeId)
        ? `${safeId}-${fallbackIndex + 1}`
        : safeId;
      seenIds.add(id);

      const rawOrder = Number(source.order);
      const order = Number.isFinite(rawOrder)
        ? Math.max(0, Math.trunc(rawOrder))
        : fallbackIndex;

      return {
        id,
        title,
        url,
        enabled: source.enabled !== false,
        order,
      };
    })
    .filter((item): item is CustomLinkItem => Boolean(item));

  return normalized
    .sort((a, b) => a.order - b.order)
    .slice(0, Math.max(0, maxLinks))
    .map((item, index) => ({
      ...item,
      order: index,
    }));
}
