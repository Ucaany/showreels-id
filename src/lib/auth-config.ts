/**
 * Auth configuration helpers.
 * With Auth.js migration, Supabase is no longer used.
 * These functions are kept for backward compatibility but always return
 * values reflecting the new Auth.js setup.
 */

/** Auth.js is configured when AUTH_SECRET/NEXTAUTH_SECRET is available */
export function isAuthConfigured() {
  return Boolean(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET);
}

/** Google OAuth is enabled if one of the supported env key pairs is configured */
export function isGoogleAuthEnabled() {
  return Boolean(
    (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) ||
      (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  );
}

/**
 * @deprecated Use isAuthConfigured() instead
 */
export function isSupabaseConfigured() {
  return false;
}
