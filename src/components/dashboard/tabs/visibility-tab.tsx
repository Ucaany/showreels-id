"use client";

import { useState } from "react";
import { useDashboardStore } from "@/stores/dashboard-store";
import type { VideoItem } from "@/lib/types";

/**
 * VisibilityTab - Kontrol visibilitas video dengan Optimistic UI.
 *
 * Flow:
 * 1. User toggle → UI update instant (optimistic)
 * 2. Background API call ke /api/videos/{id}
 * 3. Jika error → rollback ke state sebelumnya
 * 4. Visual feedback: syncing indicator per-video
 */
export function VisibilityTab() {
  const videos = useDashboardStore((s) => s.videos);
  const updateVideoVisibility = useDashboardStore(
    (s) => s.updateVideoVisibility
  );
  const syncingVideoId = useDashboardStore((s) => s.syncingVideoId);
  const setSyncingVideoId = useDashboardStore((s) => s.setSyncingVideoId);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleToggleVisibility = async (
    videoId: string,
    currentVisibility: VideoItem["visibility"]
  ) => {
    const newVisibility: VideoItem["visibility"] =
      currentVisibility === "public" ? "private" : "public";

    // 1. OPTIMISTIC UPDATE - Instant UI change (0ms)
    updateVideoVisibility(videoId, newVisibility);
    setSyncingVideoId(videoId);
    setErrorMessage(null);

    try {
      // 2. BACKGROUND API CALL
      // Find the video to get its full data for the PATCH request
      const video = videos.find((v) => v.id === videoId);
      if (!video) throw new Error("Video not found");

      const res = await fetch(`/api/videos/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: video.title,
          sourceUrl: video.sourceUrl,
          tags: video.tags.join(", "),
          visibility: newVisibility,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || `Gagal mengubah visibilitas (${res.status})`
        );
      }

      // Success - UI already updated
    } catch (error) {
      // 3. ERROR → ROLLBACK
      updateVideoVisibility(videoId, currentVisibility);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengubah visibilitas. Silakan coba lagi."
      );
    } finally {
      setSyncingVideoId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">
          Kontrol Visibilitas
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Atur visibilitas video Anda secara instant. Perubahan langsung
          terlihat.
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span className="mr-1 font-medium">⚠️ Error:</span>
          {errorMessage}
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-2 text-red-500 underline hover:text-red-700"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Video Visibility List */}
      {videos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
          <p className="text-sm text-neutral-500">
            Belum ada video untuk dikelola visibilitasnya.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => {
            const isSyncing = syncingVideoId === video.id;
            const isPublic = video.visibility === "public";

            return (
              <div
                key={video.id}
                className={`flex items-center justify-between rounded-xl border bg-white p-4 transition-all ${
                  isSyncing
                    ? "border-blue-200 bg-blue-50/30"
                    : "border-neutral-200"
                }`}
              >
                {/* Video Info */}
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  {/* Thumbnail */}
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {video.thumbnailUrl ? (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl text-neutral-300">
                        🎬
                      </div>
                    )}
                  </div>

                  {/* Title & Status */}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-neutral-900">
                      {video.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          isPublic ? "text-green-600" : "text-neutral-500"
                        }`}
                      >
                        {isPublic ? "🌍 Public" : "🔒 Private"}
                      </span>

                      {/* Syncing Indicator */}
                      {isSyncing && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-500">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                          Menyimpan...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() =>
                    handleToggleVisibility(video.id, video.visibility)
                  }
                  disabled={isSyncing}
                  className={`
                    relative ml-4 inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200
                    ${isPublic ? "bg-green-500" : "bg-neutral-300"}
                    ${isSyncing ? "cursor-wait opacity-70" : "hover:opacity-90"}
                  `}
                  aria-label={`Toggle visibility for ${video.title}`}
                  title={
                    isPublic
                      ? "Klik untuk jadikan Private"
                      : "Klik untuk jadikan Public"
                  }
                >
                  <span
                    className={`
                      inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200
                      ${isPublic ? "translate-x-6" : "translate-x-1"}
                    `}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="rounded-lg bg-neutral-50 p-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Keterangan
        </h4>
        <div className="flex flex-wrap gap-4 text-xs text-neutral-600">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-green-500" />
            Public — Terlihat oleh semua orang
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-neutral-300" />
            Private — Hanya Anda yang bisa melihat
          </span>
        </div>
      </div>
    </div>
  );
}
