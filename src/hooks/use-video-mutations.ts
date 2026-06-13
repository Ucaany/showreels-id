import { useSWRConfig } from 'swr'
import { fetcher, postFetcher, putFetcher, patchFetcher, deleteFetcher } from '@/lib/fetcher'
import { CACHE_KEYS } from '@/lib/swr-config'
import type { Video } from './use-dashboard-data'

/**
 * Video input type untuk create/update
 */
export type VideoInput = {
  title: string
  description?: string | null
  sourceUrl: string
  thumbnailUrl?: string | null
  visibility?: string
}

/**
 * Hook untuk video mutations dengan optimistic updates
 */
export function useVideoMutations() {
  const { mutate } = useSWRConfig()

  /**
   * Create new video dengan optimistic update
   */
  const createVideo = async (data: VideoInput) => {
    // Optimistic update - add temporary video to list
    mutate(
      CACHE_KEYS.VIDEOS,
      async (currentVideos: Video[] = []) => {
        const tempVideo: Video = {
          id: 'temp-' + Date.now(),
          title: data.title,
          description: data.description || null,
          sourceUrl: data.sourceUrl,
          thumbnailUrl: data.thumbnailUrl || null,
          visibility: data.visibility || 'public',
          isPinned: false,
          createdAt: new Date().toISOString(),
        }
        return [tempVideo, ...currentVideos]
      },
      { revalidate: false }
    )

    try {
      // Actual API call
      const newVideo = await postFetcher<Video>(CACHE_KEYS.VIDEOS, data)

      // Revalidate to get real data from server
      await mutate(CACHE_KEYS.VIDEOS)
      await mutate(CACHE_KEYS.DASHBOARD_SUMMARY)

      return newVideo
    } catch (error) {
      // Rollback on error
      await mutate(CACHE_KEYS.VIDEOS)
      throw error
    }
  }

  /**
   * Update existing video dengan optimistic update
   */
  const updateVideo = async (id: string, data: Partial<VideoInput>) => {
    // Optimistic update - update video in list
    mutate(
      CACHE_KEYS.VIDEOS,
      async (currentVideos: Video[] = []) => {
        return currentVideos.map(v => 
          v.id === id ? { ...v, ...data } : v
        )
      },
      { revalidate: false }
    )

    try {
      // Actual API call
      const updated = await putFetcher<Video>(`${CACHE_KEYS.VIDEOS}/${id}`, data)

      // Revalidate to get real data from server
      await mutate(CACHE_KEYS.VIDEOS)

      return updated
    } catch (error) {
      // Rollback on error
      await mutate(CACHE_KEYS.VIDEOS)
      throw error
    }
  }

  /**
   * Delete video dengan optimistic update
   */
  const deleteVideo = async (id: string) => {
    // Optimistic update - remove video from list
    mutate(
      CACHE_KEYS.VIDEOS,
      async (currentVideos: Video[] = []) => {
        return currentVideos.filter(v => v.id !== id)
      },
      { revalidate: false }
    )

    try {
      // Actual API call
      await deleteFetcher(`${CACHE_KEYS.VIDEOS}/${id}`)

      // Revalidate to confirm deletion
      await mutate(CACHE_KEYS.VIDEOS)
      await mutate(CACHE_KEYS.DASHBOARD_SUMMARY)
    } catch (error) {
      // Rollback on error
      await mutate(CACHE_KEYS.VIDEOS)
      throw error
    }
  }

  /**
   * Toggle video pin status
   */
  const togglePin = async (id: string, isPinned: boolean) => {
    // Optimistic update
    mutate(
      CACHE_KEYS.VIDEOS,
      async (currentVideos: Video[] = []) => {
        return currentVideos.map(v => 
          v.id === id ? { ...v, isPinned } : v
        )
      },
      { revalidate: false }
    )

    try {
      // Actual API call
      await postFetcher(`${CACHE_KEYS.VIDEOS}/pin`, { videoId: id, isPinned })

      // Revalidate
      await mutate(CACHE_KEYS.VIDEOS)
    } catch (error) {
      // Rollback on error
      await mutate(CACHE_KEYS.VIDEOS)
      throw error
    }
  }

  return {
    createVideo,
    updateVideo,
    deleteVideo,
    togglePin,
  }
}
