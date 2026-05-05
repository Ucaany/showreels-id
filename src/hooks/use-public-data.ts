import useSWR, { SWRConfiguration } from 'swr'
import { fetcher } from '@/lib/fetcher'
import { CACHE_KEYS, CACHE_TIMES } from '@/lib/swr-config'

/**
 * Type definitions untuk public data
 */
export type LandingStats = {
  creatorCount: number
  videoCount: number
  featuredCreators: Array<{
    username: string
    name: string | null
    image: string | null
    videoCount: number
  }>
}

export type PublicProfile = {
  username: string
  name: string | null
  bio: string | null
  image: string | null
  visibility: string
  [key: string]: any
}

export type PublicVideo = {
  id: string
  slug: string
  title: string
  description: string | null
  sourceUrl: string
  thumbnailUrl: string | null
  createdAt: string
  [key: string]: any
}

/**
 * Hook untuk fetch landing page stats
 * Cache untuk 1 hour karena data jarang berubah
 */
export function useLandingStats(config?: SWRConfiguration) {
  return useSWR<LandingStats>(
    CACHE_KEYS.LANDING_STATS,
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.STATIC,
      revalidateOnFocus: false, // Stats jarang berubah
      ...config,
    }
  )
}

/**
 * Hook untuk fetch public creator profile
 * Conditional fetching - only fetch if username exists
 */
export function usePublicProfile(username: string | null, config?: SWRConfiguration) {
  return useSWR<PublicProfile>(
    username ? CACHE_KEYS.PUBLIC_PROFILE(username) : null,
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.DYNAMIC,
      ...config,
    }
  )
}

/**
 * Hook untuk fetch public videos showcase
 * Conditional fetching - only fetch if username exists
 */
export function usePublicVideos(username: string | null, config?: SWRConfiguration) {
  return useSWR<PublicVideo[]>(
    username ? CACHE_KEYS.PUBLIC_VIDEOS(username) : null,
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.DYNAMIC,
      ...config,
    }
  )
}
