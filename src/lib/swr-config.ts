import { SWRConfiguration } from 'swr'

/**
 * Global SWR Configuration
 * Mengatur strategi cache dan revalidation untuk seluruh aplikasi
 */
export const swrConfig: SWRConfiguration = {
  // Revalidation Strategy
  revalidateOnFocus: true,        // Revalidate saat user kembali ke tab
  revalidateOnReconnect: true,    // Revalidate saat reconnect internet
  revalidateIfStale: true,        // Revalidate jika data stale
  
  // Cache Strategy
  dedupingInterval: 2000,         // Dedupe requests dalam 2 detik
  focusThrottleInterval: 5000,    // Throttle focus revalidation
  
  // Error Handling
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  
  // Performance
  keepPreviousData: true,         // Keep old data saat fetching new data
}

/**
 * Cache time configurations per data type
 * Digunakan untuk mengatur dedupingInterval per endpoint
 */
export const CACHE_TIMES = {
  STATIC: 3600000,      // 1 hour - untuk data jarang berubah (landing stats)
  DYNAMIC: 60000,       // 1 minute - untuk data sering berubah (profile, videos)
  REALTIME: 5000,       // 5 seconds - untuk data real-time (analytics, notifications)
  INFINITE: Infinity,   // Never expire - untuk data immutable
} as const

/**
 * Cache key constants
 * Centralized cache keys untuk consistency
 */
export const CACHE_KEYS = {
  // Dashboard
  PROFILE: '/api/profile',
  VIDEOS: '/api/videos',
  ANALYTICS_SUMMARY: (range: string) => `/api/analytics/summary?range=${range}`,
  ANALYTICS_TRAFFIC: (range: string) => `/api/analytics/traffic?range=${range}`,
  ANALYTICS_TOP_PAGES: (range: string) => `/api/analytics/top-pages?range=${range}`,
  BILLING_PLAN: '/api/billing/plan',
  BILLING_TRANSACTIONS: '/api/billing/transactions',
  NOTIFICATIONS: '/api/notifications',
  DASHBOARD_SUMMARY: '/api/dashboard/summary',
  
  // Public
  LANDING_STATS: '/api/public/landing-stats',
  PUBLIC_PROFILE: (username: string) => `/api/public/profile/${username}`,
  PUBLIC_VIDEOS: (username: string) => `/api/public/videos/${username}`,
  
  // Settings
  SETTINGS_LINK_PROFILE: '/api/settings/link-profile',
  SETTINGS_PRIVACY: '/api/settings/privacy',
  SETTINGS_PAYMENT: '/api/settings/payment',
  SETTINGS_WHITELABEL: '/api/settings/whitelabel',
  
  // Link Builder
  LINKS: '/api/links',
  LINK_TYPES: '/api/link-types',
  BLOCKS: '/api/blocks',
  CREATOR_LINKS: '/api/creator-links',
} as const
