'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ComponentProps, useCallback, useRef } from 'react'
import { useSWRConfig } from 'swr'
import { fetcher } from '@/lib/fetcher'

type PrefetchLinkProps = ComponentProps<typeof Link> & {
  /**
   * API endpoints to prefetch
   * Can be a single endpoint or array of endpoints
   */
  prefetchData?: string | string[]
  
  /**
   * Delay before prefetching (in ms)
   * Default: 100ms
   */
  prefetchDelay?: number
  
  /**
   * Disable prefetching
   * Useful for conditional prefetching
   */
  disablePrefetch?: boolean
}

/**
 * Smart Link component dengan prefetching capabilities
 * 
 * Features:
 * - Prefetch Next.js route on hover/focus
 * - Prefetch API data dan cache dengan SWR
 * - Configurable delay untuk avoid unnecessary prefetches
 * - Supports multiple endpoints prefetching
 * 
 * @example
 * ```tsx
 * // Simple prefetch
 * <PrefetchLink href="/dashboard/videos" prefetchData="/api/videos">
 *   Videos
 * </PrefetchLink>
 * 
 * // Multiple endpoints
 * <PrefetchLink 
 *   href={`/creator/${username}`}
 *   prefetchData={[
 *     `/api/public/profile/${username}`,
 *     `/api/public/videos/${username}`
 *   ]}
 * >
 *   View Profile
 * </PrefetchLink>
 * 
 * // Conditional prefetch
 * <PrefetchLink 
 *   href="/premium"
 *   prefetchData="/api/premium-content"
 *   disablePrefetch={!isPremiumUser}
 * >
 *   Premium Content
 * </PrefetchLink>
 * ```
 */
export function PrefetchLink({
  prefetchData,
  prefetchDelay = 100,
  disablePrefetch = false,
  onMouseEnter,
  onFocus,
  ...props
}: PrefetchLinkProps) {
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const handlePrefetch = useCallback(() => {
    if (disablePrefetch) return

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      // Prefetch Next.js route
      router.prefetch(props.href.toString())

      // Prefetch API data
      if (prefetchData) {
        const endpoints = Array.isArray(prefetchData) 
          ? prefetchData 
          : [prefetchData]

        endpoints.forEach(endpoint => {
          // Trigger SWR to fetch and cache
          // Using mutate with fetcher to populate cache
          mutate(
            endpoint,
            fetcher(endpoint).catch(() => {
              // Silently fail prefetch errors
              // User will see loading state on actual navigation
              return undefined
            }),
            { revalidate: false }
          )
        })
      }
    }, prefetchDelay)
  }, [props.href, prefetchData, prefetchDelay, disablePrefetch, router, mutate])

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      handlePrefetch()
      onMouseEnter?.(e)
    },
    [handlePrefetch, onMouseEnter]
  )

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLAnchorElement>) => {
      handlePrefetch()
      onFocus?.(e)
    },
    [handlePrefetch, onFocus]
  )

  // Cleanup timeout on unmount
  useCallback(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <Link
      {...props}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
    />
  )
}
