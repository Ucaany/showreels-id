/**
 * In-memory rate limiter for API endpoints.
 * Uses sliding window counter algorithm.
 * When Upstash env vars are set, selected endpoints use @upstash/ratelimit.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type SlidingWindow = `${number} ${"s" | "m" | "h" | "d"}`;

let sharedRedisForRatelimit: Redis | null | undefined;

function getSharedRedisForRatelimit(): Redis | null {
  if (sharedRedisForRatelimit !== undefined) return sharedRedisForRatelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    sharedRedisForRatelimit = null;
    return sharedRedisForRatelimit;
  }
  try {
    sharedRedisForRatelimit = new Redis({ url, token });
  } catch {
    sharedRedisForRatelimit = null;
  }
  return sharedRedisForRatelimit;
}

const slidingRatelimitCache = new Map<string, Ratelimit | null>();

function getSlidingRatelimit(
  cacheKey: string,
  prefix: string,
  requests: number,
  window: SlidingWindow
): Ratelimit | null {
  if (slidingRatelimitCache.has(cacheKey)) {
    return slidingRatelimitCache.get(cacheKey) ?? null;
  }
  const redis = getSharedRedisForRatelimit();
  if (!redis) {
    slidingRatelimitCache.set(cacheKey, null);
    return null;
  }
  try {
    const rl = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix,
    });
    slidingRatelimitCache.set(cacheKey, rl);
    return rl;
  } catch {
    slidingRatelimitCache.set(cacheKey, null);
    return null;
  }
}

function upstashResultToRateLimit(
  result: Awaited<ReturnType<Ratelimit["limit"]>>
): RateLimitResult {
  const resetRaw = result.reset as unknown;
  const resetAt =
    typeof resetRaw === "number"
      ? resetRaw
      : resetRaw instanceof Date
        ? resetRaw.getTime()
        : Date.now() + 60_000;
  return {
    success: result.success,
    remaining: result.remaining,
    resetAt,
  };
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

// Cleanup interval to prevent memory leaks
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [, store] of stores) {
      for (const [key, entry] of store) {
        if (now > entry.resetAt) {
          store.delete(key);
        }
      }
    }
  }, 60_000); // Cleanup every minute

  // Unref so it doesn't prevent process exit
  if (typeof cleanupInterval === "object" && "unref" in cleanupInterval) {
    cleanupInterval.unref();
  }
}

function getStore(namespace: string): Map<string, RateLimitEntry> {
  let store = stores.get(namespace);
  if (!store) {
    store = new Map();
    stores.set(namespace, store);
    ensureCleanup();
  }
  return store;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given identifier.
 * Returns whether the request is allowed.
 */
export function checkRateLimit(
  namespace: string,
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const store = getStore(namespace);
  const now = Date.now();
  const entry = store.get(identifier);

  // No existing entry or window expired - allow and start new window
  if (!entry || now > entry.resetAt) {
    store.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  // Within window - check count
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment and allow
  entry.count++;
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Pre-configured rate limiters for common use cases.
 */
export const rateLimiters = {
  /** Login: 5 attempts per 15 minutes per IP */
  login: (ip: string) =>
    checkRateLimit("login", ip, {
      maxRequests: 5,
      windowMs: 15 * 60 * 1000,
    }),

  /** Bootstrap: 10 calls per minute per IP */
  bootstrap: (ip: string) =>
    checkRateLimit("bootstrap", ip, {
      maxRequests: 10,
      windowMs: 60 * 1000,
    }),

  /** Password reset: 3 attempts per 15 minutes per email */
  passwordReset: (email: string) =>
    checkRateLimit("password-reset", email, {
      maxRequests: 3,
      windowMs: 15 * 60 * 1000,
    }),

  /** Email sending: 10 emails per minute globally */
  emailSend: (identifier: string) =>
    checkRateLimit("email-send", identifier, {
      maxRequests: 10,
      windowMs: 60 * 1000,
    }),
};

/**
 * Bootstrap POST: prefer Upstash sliding window when Redis is configured.
 */
export async function checkBootstrapRateLimit(ip: string): Promise<RateLimitResult> {
  const rl = getSlidingRatelimit("bootstrap", "ratelimit_bootstrap", 10, "1 m");
  if (rl) {
    const result = await rl.limit(ip);
    return upstashResultToRateLimit(result);
  }
  return checkRateLimit("bootstrap", ip, {
    maxRequests: 10,
    windowMs: 60 * 1000,
  });
}

/** Register: 10 / jam per IP (Upstash jika ada). */
export async function checkRegisterRateLimit(ip: string): Promise<RateLimitResult> {
  const rl = getSlidingRatelimit("register", "ratelimit_register", 10, "1 h");
  if (rl) {
    const result = await rl.limit(ip);
    return upstashResultToRateLimit(result);
  }
  return checkRateLimit("register", ip, {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
  });
}

/** Verifikasi pemulihan password: 10 / 15 menit per IP. */
export async function checkPasswordRecoveryVerifyRateLimit(ip: string): Promise<RateLimitResult> {
  const rl = getSlidingRatelimit("recovery_verify", "ratelimit_recovery_verify", 10, "15 m");
  if (rl) {
    const result = await rl.limit(ip);
    return upstashResultToRateLimit(result);
  }
  return checkRateLimit("recovery-verify", ip, {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000,
  });
}

/** Demo login: 30 / menit per IP. */
export async function checkDemoLoginRateLimit(ip: string): Promise<RateLimitResult> {
  const rl = getSlidingRatelimit("demo_login", "ratelimit_demo_login", 30, "1 m");
  if (rl) {
    const result = await rl.limit(ip);
    return upstashResultToRateLimit(result);
  }
  return checkRateLimit("demo-login", ip, {
    maxRequests: 30,
    windowMs: 60 * 1000,
  });
}

/**
 * Extract client IP from request headers.
 * Handles Vercel/Cloudflare proxy headers.
 */
export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);

  // Vercel
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }

  // Cloudflare
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Vercel specific
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp;
  }

  return "unknown";
}

/**
 * Create a rate limit exceeded response with proper headers.
 */
export function rateLimitExceededResponse(result: RateLimitResult): Response {
  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({
      error: "Too many requests. Please try again later.",
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    }
  );
}
