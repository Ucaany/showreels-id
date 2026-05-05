import { useRef, useCallback } from 'react'

type RequestState = {
  pending: boolean
  result: any
  error: any
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
export function useIdempotentRequest<T = any>() {
  const requestsRef = useRef<Map<string, RequestState>>(new Map())

  const execute = useCallback(async (
    key: string,
    fn: () => Promise<T>,
    options?: IdempotentRequestOptions
  ): Promise<T> => {
    const { ttl = 5000, force = false } = options || {}

    // Check if request is already pending
    const existing = requestsRef.current.get(key)
    
    if (existing && !force) {
      if (existing.pending) {
        // Wait for pending request
        return new Promise((resolve, reject) => {
          const checkInterval = setInterval(() => {
            const current = requestsRef.current.get(key)
            if (current && !current.pending) {
              clearInterval(checkInterval)
              if (current.error) reject(current.error)
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
      
      if (existing.result) {
        // Return cached result
        return existing.result
      }
    }

    // Mark as pending
    requestsRef.current.set(key, { pending: true, result: null, error: null })

    try {
      const result = await fn()
      
      // Store result
      requestsRef.current.set(key, { pending: false, result, error: null })
      
      // Clear after TTL
      setTimeout(() => {
        requestsRef.current.delete(key)
      }, ttl)
      
      return result
    } catch (error) {
      // Store error
      requestsRef.current.set(key, { pending: false, result: null, error })
      
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
