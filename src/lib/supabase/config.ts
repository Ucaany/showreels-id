import { hasPlaceholderEnvValue, normalizeEnvValue } from "@/lib/env-utils";

export function getSupabaseUrl() {
  return normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabasePublishableKey() {
  return normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function isSupabaseConfigured() {
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();

  if (hasPlaceholderEnvValue(url) || hasPlaceholderEnvValue(key)) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && key.length > 0;
  } catch {
    return false;
  }
}
