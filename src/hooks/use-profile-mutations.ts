import { useSWRConfig } from 'swr'
import { patchFetcher, deleteFetcher } from '@/lib/fetcher'
import { CACHE_KEYS } from '@/lib/swr-config'
import type { Profile } from './use-dashboard-data'

/**
 * Profile update input type
 */
export type ProfileUpdateInput = {
  name?: string | null
  bio?: string | null
  image?: string | null
  visibility?: string
  [key: string]: unknown
}

/**
 * Hook untuk profile mutations dengan optimistic updates
 */
export function useProfileMutations() {
  const { mutate } = useSWRConfig()

  /**
   * Update profile dengan optimistic update
   */
  const updateProfile = async (data: ProfileUpdateInput) => {
    // Optimistic update
    mutate(
      CACHE_KEYS.PROFILE,
      async (currentProfile: Profile | undefined) => {
        if (!currentProfile) return currentProfile
        return { ...currentProfile, ...data }
      },
      { revalidate: false }
    )

    try {
      // Actual API call
      const updated = await patchFetcher<Profile>(CACHE_KEYS.PROFILE, data)

      // Revalidate to get real data from server
      await mutate(CACHE_KEYS.PROFILE)
      await mutate(CACHE_KEYS.DASHBOARD_SUMMARY)

      return updated
    } catch (error) {
      // Rollback on error
      await mutate(CACHE_KEYS.PROFILE)
      throw error
    }
  }

  /**
   * Update profile visibility
   */
  const updateVisibility = async (visibility: string) => {
    // Optimistic update
    mutate(
      CACHE_KEYS.PROFILE,
      async (currentProfile: Profile | undefined) => {
        if (!currentProfile) return currentProfile
        return { ...currentProfile, visibility }
      },
      { revalidate: false }
    )

    try {
      // Actual API call
      await patchFetcher(`${CACHE_KEYS.PROFILE}/visibility`, { visibility })

      // Revalidate
      await mutate(CACHE_KEYS.PROFILE)
    } catch (error) {
      // Rollback on error
      await mutate(CACHE_KEYS.PROFILE)
      throw error
    }
  }

  /**
   * Delete profile/account
   */
  const deleteProfile = async () => {
    try {
      // Actual API call
      await deleteFetcher(CACHE_KEYS.PROFILE)

      // Clear all caches
      mutate(() => true, undefined, { revalidate: false })
    } catch (error) {
      throw error
    }
  }

  return {
    updateProfile,
    updateVisibility,
    deleteProfile,
  }
}
