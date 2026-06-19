"use client";

import { useDashboardStore } from "@/stores/dashboard-store";

/**
 * VideosTab - Menampilkan daftar video dari Zustand store.
 * Instant render (0ms) karena data sudah ada di memory.
 */
export function VideosTab() {
  const videos = useDashboardStore((s) => s.videos);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl">
            Halaman Video
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {videos.length} video tersimpan
          </p>
        </div>
      </div>

      {/* Video List */}
      {videos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
          <p className="text-sm text-neutral-500">
            Belum ada video. Tambahkan video pertama Anda dari halaman Video.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <div
              key={video.id}
              className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-neutral-100">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl text-neutral-300">
                    🎬
                  </div>
                )}

                {/* Visibility Badge */}
                <span
                  className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                    video.visibility === "public"
                      ? "bg-green-100 text-green-700"
                      : video.visibility === "private"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {video.visibility === "public" && "Publik"}
                  {video.visibility === "private" && "Private"}
                  {video.visibility === "semi_private" && "Semi-Private"}
                  {video.visibility === "draft" && "Draft"}
                </span>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="truncate text-sm font-semibold text-neutral-900">
                  {video.title}
                </h3>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 capitalize">
                    {video.source}
                  </span>
                  {video.tags.length > 0 && (
                    <span className="truncate text-xs text-neutral-400">
                      {video.tags.slice(0, 2).join(", ")}
                      {video.tags.length > 2 && ` +${video.tags.length - 2}`}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-neutral-400">
                  {video.createdAt
                    ? new Date(video.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
