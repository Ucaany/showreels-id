/**
 * Auth configuration helpers.
 * With Auth.js migration, Supabase is no longer used.
 * These functions are kept for backward compatibility but always return
 * values reflecting the new Auth.js setup.
 */

/** Auth.js is always configured when AUTH_SECRET is set */
export function isAuthConfigured() {
  return Boolean(process.env.AUTH_SECRET);
}

/** Google OAuth is not currently enabled (Credentials-only) */
export function isGoogleAuthEnabled() {
  return false;
}

/**
 * @deprecated Use isAuthConfigured() instead
 */
export function isSupabaseConfigured() {
  return false;
}
