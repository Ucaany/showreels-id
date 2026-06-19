'use client'

import { SWRConfig } from 'swr'
import { swrConfig } from '@/lib/swr-config'
import { ReactNode } from 'react'

type SWRProviderProps = {
  children: ReactNode
}

/**
 * SWR Provider wrapper
 * Provides global SWR configuration untuk seluruh aplikasi
 * 
 * Features:
 * - Global cache management
 * - Automatic revalidation
 * - Request deduplication
 * - Error retry strategy
 * - Focus/reconnect revalidation
 */
export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  )
}
