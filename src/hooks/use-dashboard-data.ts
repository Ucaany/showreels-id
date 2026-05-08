import useSWR, { SWRConfiguration } from 'swr'
import { fetcher } from '@/lib/fetcher'
import { CACHE_KEYS, CACHE_TIMES } from '@/lib/swr-config'

/**
 * Type definitions untuk dashboard data
 */
export type Profile = {
  id: string
  name: string | null
  username: string
  email: string
  image: string | null
  bio: string | null
  visibility: string
  [key: string]: any
}

export type Video = {
  id: string
  title: string
  description: string | null
  sourceUrl: string
  thumbnailUrl: string | null
  visibility: string
  isPinned: boolean
  createdAt: string
  [key: string]: any
}

export type AnalyticsSummary = {
  totalViews: number
  totalClicks: number
  uniqueVisitors: number
  [key: string]: any
}

export type BillingPlan = {
  currentPlan: string
  status: string
  expiresAt: string | null
  [key: string]: any
}

export type Notification = {
  id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  [key: string]: any
}

/**
 * Hook untuk fetch user profile
 * Revalidate on focus dan reconnect
 */
export function useProfile(config?: SWRConfiguration) {
  return useSWR<Profile>(
    CACHE_KEYS.PROFILE,
    fetcher,
    {
      revalidateOnMount: true,
      dedupingInterval: CACHE_TIMES.DYNAMIC,
      ...config,
    }
  )
}

/**
 * Hook untuk fetch videos list
 * Revalidate on focus dan reconnect
 */
export function useVideos(config?: SWRConfiguration) {
  return useSWR<Video[]>(
    CACHE_KEYS.VIDEOS,
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.DYNAMIC,
      ...config,
    }
  )
}

/**
 * Hook untuk fetch analytics summary
 * Auto refresh every 120 seconds — analytics tidak perlu real-time,
 * mengurangi database reads sebesar 75%
 */
export function useAnalyticsSummary(range: string = '7d', config?: SWRConfiguration) {
  return useSWR<AnalyticsSummary>(
    CACHE_KEYS.ANALYTICS_SUMMARY(range),
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.DYNAMIC,
      refreshInterval: 120000, // Auto refresh every 2 minutes (hemat 75% DB reads)
      revalidateOnFocus: false, // Tidak perlu refetch saat tab focus
      ...config,
    }
  )
}

/**
 * Hook untuk fetch analytics traffic
 * Revalidate hanya saat mount atau manual trigger
 */
export function useAnalyticsTraffic(range: string = '7d', config?: SWRConfiguration) {
  return useSWR(
    CACHE_KEYS.ANALYTICS_TRAFFIC(range),
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.DYNAMIC,
      revalidateOnFocus: false,
      ...config,
    }
  )
}

/**
 * Hook untuk fetch analytics top pages
 * Revalidate hanya saat mount atau manual trigger
 */
export function useAnalyticsTopPages(range: string = '7d', config?: SWRConfiguration) {
  return useSWR(
    CACHE_KEYS.ANALYTICS_TOP_PAGES(range),
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.DYNAMIC,
      revalidateOnFocus: false,
      ...config,
    }
  )
}

/**
 * Hook untuk fetch billing plan info
 * Revalidate on focus dan reconnect
 */
export function useBillingPlan(config?: SWRConfiguration) {
  return useSWR<BillingPlan>(
    CACHE_KEYS.BILLING_PLAN,
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.DYNAMIC,
      ...config,
    }
  )
}

/**
 * Hook untuk fetch billing transactions
 */
export function useBillingTransactions(config?: SWRConfiguration) {
  return useSWR(
    CACHE_KEYS.BILLING_TRANSACTIONS,
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.DYNAMIC,
      ...config,
    }
  )
}

/**
 * Hook untuk fetch notifications
 * Auto refresh every 1 minute
 */
export function useNotifications(config?: SWRConfiguration) {
  return useSWR<Notification[]>(
    CACHE_KEYS.NOTIFICATIONS,
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.REALTIME,
      refreshInterval: 60000, // Auto refresh every 1 minute
      ...config,
    }
  )
}

/**
 * Hook untuk fetch dashboard summary
 */
export function useDashboardSummary(config?: SWRConfiguration) {
  return useSWR(
    CACHE_KEYS.DASHBOARD_SUMMARY,
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.DYNAMIC,
      ...config,
    }
  )
}

/**
 * Hook untuk fetch settings - link profile
 */
export function useSettingsLinkProfile(config?: SWRConfiguration) {
  return useSWR(
    CACHE_KEYS.SETTINGS_LINK_PROFILE,
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.DYNAMIC,
      ...config,
    }
  )
}

/**
 * Hook untuk fetch settings - privacy
 */
export function useSettingsPrivacy(config?: SWRConfiguration) {
  return useSWR(
    CACHE_KEYS.SETTINGS_PRIVACY,
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.DYNAMIC,
      ...config,
    }
  )
}

/**
 * Hook untuk fetch settings - payment
 */
export function useSettingsPayment(config?: SWRConfiguration) {
  return useSWR(
    CACHE_KEYS.SETTINGS_PAYMENT,
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.DYNAMIC,
      ...config,
    }
  )
}

/**
 * Hook untuk fetch settings - whitelabel
 */
export function useSettingsWhitelabel(config?: SWRConfiguration) {
  return useSWR(
    CACHE_KEYS.SETTINGS_WHITELABEL,
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.DYNAMIC,
      ...config,
    }
  )
}
