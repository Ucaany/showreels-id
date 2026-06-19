import { useRef, useCallback } from 'react'

type RequestState<T> = {
  status: 'pending'
} | {
  status: 'success'
  result: T
} | {
  status: 'error'
  error: unknown
}

type IdempotentRequestOptions = {
  ttl?: number // Time to live in ms
  force?: boolean // Force re-execution
}

/**
 * Hook untuk idempotent requests
 * Prevents duplicate requests dengan same key dalam TTL period
 * 
 * @example
 * ```typescript
 * const { execute } = useIdempotentRequest()
 * 
 * const handleUpload = async () => {
 *   const result = await execute(
 *     'upload-video-123',
 *     () => uploadVideo(data),
 *     { ttl: 10000 }
 *   )
 * }
 * ```
 */
export function useIdempotentRequest<T = unknown>() {
  const requestsRef = useRef<Map<string, RequestState<T>>>(new Map())

  const execute = useCallback(async (
    key: string,
    fn: () => Promise<T>,
    options?: IdempotentRequestOptions
  ): Promise<T> => {
    const { ttl = 5000, force = false } = options || {}

    // Check if request is already pending
    const existing = requestsRef.current.get(key)
    
    if (existing && !force) {
      if (existing.status === 'pending') {
        // Wait for pending request
        return new Promise((resolve, reject) => {
          const checkInterval = setInterval(() => {
            const current = requestsRef.current.get(key)
            if (current && current.status !== 'pending') {
              clearInterval(checkInterval)
              if (current.status === 'error') reject(current.error)
              else resolve(current.result)
            }
          }, 100)
          
          // Timeout after 30 seconds
          setTimeout(() => {
            clearInterval(checkInterval)
            reject(new Error('Request timeout'))
          }, 30000)
        })
      }
      
      if (existing.status === 'success') {
        // Return cached result
        return existing.result
      }
    }

    // Mark as pending
    requestsRef.current.set(key, { status: 'pending' })

    try {
      const result = await fn()
      
      // Store result
      requestsRef.current.set(key, { status: 'success', result })
      
      // Clear after TTL
      setTimeout(() => {
        requestsRef.current.delete(key)
      }, ttl)
      
      return result
    } catch (error) {
      // Store error
      requestsRef.current.set(key, { status: 'error', error })
      
      // Clear after shorter TTL for errors
      setTimeout(() => {
        requestsRef.current.delete(key)
      }, 1000)
      
      throw error
    }
  }, [])

  const clear = useCallback((key?: string) => {
    if (key) {
      requestsRef.current.delete(key)
    } else {
      requestsRef.current.clear()
    }
  }, [])

  return { execute, clear }
}
