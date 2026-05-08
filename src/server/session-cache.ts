/**
 * In-memory session cache for fast auth lookups.
 * Reduces Supabase getUser() calls by caching validated sessions.
 * 
 * Future upgrade: Replace with @upstash/redis when Redis is available.
 */

interface CachedSession {
  userId: string;
  email: string | undefined;
  role: string;
  expiresAt: number;
}

const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 500;

const cache = new Map<string, CachedSession>();

/**
 * Get a cached session by access token hash.
 * Returns null if not found or expired.
 */
export function getCachedSession(tokenHash: string): CachedSession | null {
  const entry = cache.get(tokenHash);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(tokenHash);
    return null;
  }

  return entry;
}

/**
 * Store a session in cache.
 * Uses simple LRU eviction when cache is full.
 */
export function setCachedSession(
  tokenHash: string,
  session: Omit<CachedSession, "expiresAt">
): void {
  // Simple eviction: remove oldest entries when cache is full
  if (cache.size >= MAX_CACHE_SIZE) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }

  cache.set(tokenHash, {
    ...session,
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
}

/**
 * Invalidate a specific session from cache.
 */
export function invalidateSession(tokenHash: string): void {
  cache.delete(tokenHash);
}

/**
 * Clear all cached sessions.
 * Useful for admin operations or testing.
 */
export function clearSessionCache(): void {
  cache.clear();
}

/**
 * Get cache stats for monitoring.
 */
export function getSessionCacheStats() {
  return {
    size: cache.size,
    maxSize: MAX_CACHE_SIZE,
    ttlMs: SESSION_TTL_MS,
  };
}

/**
 * Simple hash function for access tokens.
 * Uses a fast non-cryptographic hash for cache keys.
 */
export function hashToken(token: string): string {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    const char = token.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `sess_${hash.toString(36)}`;
}
