const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

export function isGoogleAuthEnabled() {
  const rawValue = (process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH || "")
    .trim()
    .toLowerCase();

  return isSupabaseConfigured() && TRUE_VALUES.has(rawValue);
}
