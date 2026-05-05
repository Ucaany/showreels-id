"use client";

function normalizeOrigin(value?: string) {
  const trimmed = value?.trim().replace(/\/+$/, "");
  if (!trimmed) return "";

  try {
    return new URL(trimmed).origin;
  } catch {
    return "";
  }
}

export function getAuthRedirectUrl(nextPath: string) {
  const currentOrigin = window.location.origin;
  const currentHost = window.location.hostname;
  const productionOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  const redirectOrigin =
    currentHost === "localhost" || currentHost === "127.0.0.1"
      ? currentOrigin
      : productionOrigin || currentOrigin;

  return `${redirectOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}
