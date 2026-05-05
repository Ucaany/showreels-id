import { NextRequest, NextResponse } from 'next/server'

// In-memory cache sebagai fallback jika Redis tidak tersedia
const memoryCache = new Map<string, { data: any; timestamp: number }>()
const MEMORY_CACHE_TTL = 86400000 // 24 hours in ms

/**
 * Simple in-memory idempotency cache
 * Digunakan jika Redis tidak tersedia
 */
class MemoryIdempotencyCache {
  async get(key: string): Promise<any | null> {
    const cached = memoryCache.get(key)
    if (!cached) return null
    
    // Check if expired
    if (Date.now() - cached.timestamp > MEMORY_CACHE_TTL) {
      memoryCache.delete(key)
      return null
    }
    
    return cached.data
  }

  async set(key: string, data: any): Promise<void> {
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
  private redis: any

  constructor() {
    // Lazy load Redis only if credentials are available
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const { Redis } = require('@upstash/redis')
        this.redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        })
      } catch (error) {
        console.warn('Redis not available, falling back to memory cache')
        this.redis = null
      }
    }
  }

  async get(key: string): Promise<any | null> {
    if (!this.redis) return null
    
    try {
      const data = await this.redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  async set(key: string, data: any): Promise<void> {
    if (!this.redis) return
    
    try {
      await this.redis.setex(key, 86400, JSON.stringify(data)) // 24 hours
    } catch (error) {
      console.error('Redis set error:', error)
    }
  }
}

// Initialize cache (Redis or Memory)
const cache = process.env.UPSTASH_REDIS_REST_URL 
  ? new RedisIdempotencyCache()
  : new MemoryIdempotencyCache()

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
  const cached = await cache.get(cacheKey)

  if (cached) {
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
