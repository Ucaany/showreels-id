const FALLBACK_NEXT_PATH = "/dashboard";

export function getSafeNextPath(
  value: string | null | undefined,
  fallback = FALLBACK_NEXT_PATH
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const parsed = new URL(value, "http://localhost");
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || fallback;
  } catch {
    return fallback;
  }
}
