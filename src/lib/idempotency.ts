import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

// In-memory cache sebagai fallback jika Redis tidak tersedia
const memoryCache = new Map<string, { data: unknown; timestamp: number }>()
const MEMORY_CACHE_TTL = 86400000 // 24 hours in ms

type CachedResponse = {
  status: number
  headers: Record<string, string>
  body: string
}

interface IdempotencyCache {
  get(key: string): Promise<unknown | null>
  set(key: string, data: unknown): Promise<void>
}

/**
 * Simple in-memory idempotency cache
 * Digunakan jika Redis tidak tersedia
 */
class MemoryIdempotencyCache {
  async get(key: string): Promise<unknown | null> {
    const cached = memoryCache.get(key)
    if (!cached) return null
    
    // Check if expired
    if (Date.now() - cached.timestamp > MEMORY_CACHE_TTL) {
      memoryCache.delete(key)
      return null
    }
    
    return cached.data
  }

  async set(key: string, data: unknown): Promise<void> {
    memoryCache.set(key, {
      data,
      timestamp: Date.now(),
    })
    
    // Cleanup old entries periodically
    if (memoryCache.size > 1000) {
      const now = Date.now()
      for (const [k, v] of memoryCache.entries()) {
        if (now - v.timestamp > MEMORY_CACHE_TTL) {
          memoryCache.delete(k)
        }
      }
    }
  }
}

/**
 * Redis idempotency cache
 * Digunakan jika Redis credentials tersedia
 */
class RedisIdempotencyCache {
  private redis: Redis | null = null

  constructor() {
    // Lazy load Redis only if credentials are available
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        this.redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        })
      } catch {
        console.warn('Redis not available, falling back to memory cache')
        this.redis = null
      }
    }
  }

  async get(key: string): Promise<unknown | null> {
    if (!this.redis) return null
    
    try {
      const data = await this.redis.get<unknown>(key)
      return typeof data === 'string' ? JSON.parse(data) : data ?? null
    } catch {
      console.error('Redis get error')
      return null
    }
  }

  async set(key: string, data: unknown): Promise<void> {
    if (!this.redis) return
    
    try {
      await this.redis.set(key, JSON.stringify(data), { ex: 86400 }) // 24 hours
    } catch {
      console.error('Redis set error')
    }
  }
}

let idempotencyCache: IdempotencyCache | null = null

function getIdempotencyCache(): IdempotencyCache {
  if (idempotencyCache) return idempotencyCache

  idempotencyCache = process.env.UPSTASH_REDIS_REST_URL
    ? new RedisIdempotencyCache()
    : new MemoryIdempotencyCache()

  return idempotencyCache
}

function isCachedResponse(value: unknown): value is CachedResponse {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<CachedResponse>
  return (
    typeof candidate.status === 'number' &&
    typeof candidate.body === 'string' &&
    Boolean(candidate.headers) &&
    typeof candidate.headers === 'object'
  )
}

/**
 * Middleware untuk idempotency
 * Caches responses untuk prevent duplicate operations
 * 
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   return withIdempotency(request, async (req) => {
 *     // Your logic here
 *   })
 * }
 * ```
 */
export async function withIdempotency(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Only apply to POST, PUT, PATCH, DELETE
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    return handler(request)
  }

  // Get idempotency key from header
  const idempotencyKey = request.headers.get('Idempotency-Key') || 
                         request.headers.get('idempotency-key')
  
  if (!idempotencyKey) {
    // No idempotency key, process normally
    return handler(request)
  }

  // Check if we've seen this key before
  const cacheKey = `idempotency:${idempotencyKey}`
  const cache = getIdempotencyCache()
  const cached = await cache.get(cacheKey)

  if (isCachedResponse(cached)) {
    // Return cached response
    const { status, headers, body } = cached
    return new NextResponse(body, { 
      status, 
      headers: new Headers(headers) 
    })
  }

  // Process request
  const response = await handler(request)

  // Only cache successful responses (2xx)
  if (response.status >= 200 && response.status < 300) {
    // Clone response to read body
    const clonedResponse = response.clone()
    const body = await clonedResponse.text()
    
    // Cache response
    const responseData = {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body,
    }

    await cache.set(cacheKey, responseData)
  }

  return response
}

/**
 * Helper untuk generate idempotency key
 */
export function generateIdempotencyKey(prefix: string, ...parts: string[]): string {
  return `${prefix}-${parts.join('-')}-${Date.now()}`
}
