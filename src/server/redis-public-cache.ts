import { Redis } from "@upstash/redis";

let redis: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (redis !== undefined) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redis = null;
    return redis;
  }

  try {
    redis = new Redis({ url, token });
  } catch {
    redis = null;
  }
  return redis;
}

const PROFILE_PREFIX = "public_profile:v2";

export function publicProfileCacheKey(
  username: string,
  viewerKey: string,
  page: number,
  pageSize: number,
  cursorKey: string
): string {
  const safeUser = encodeURIComponent(username.toLowerCase());
  return `${PROFILE_PREFIX}:${safeUser}:${viewerKey}:${page}:${pageSize}:${cursorKey}`;
}

/** Best-effort recursive ISO date revival for cached JSON */
export function reviveDates<T>(value: unknown): T {
  if (value === null || value === undefined) return value as T;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d as T;
  }
  if (Array.isArray(value)) return value.map((v) => reviveDates(v)) as T;
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = reviveDates(v);
    }
    return out as T;
  }
  return value as T;
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    const raw = await client.get<string>(key);
    if (!raw || typeof raw !== "string") return null;
    const parsed = JSON.parse(raw) as unknown;
    return reviveDates<T>(parsed);
  } catch {
    return null;
  }
}

export async function setCachedJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    const raw = JSON.stringify(value, (_, v) => (v instanceof Date ? v.toISOString() : v));
    await client.set(key, raw, { ex: ttlSeconds });
  } catch {
    /* ignore cache write errors */
  }
}

/** Invalidate all cached profile payloads for a username (scan + del). */
export async function invalidatePublicProfileCache(username: string): Promise<void> {
  const client = getRedis();
  if (!client || !username.trim()) return;

  const pattern = `${PROFILE_PREFIX}:${encodeURIComponent(username.toLowerCase())}:*`;
  try {
    let cursor = "0";
    do {
      const [next, keys] = await client.scan(cursor, { match: pattern, count: 100 });
      cursor = next;
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } while (cursor !== "0");
  } catch {
    /* ignore */
  }
}
