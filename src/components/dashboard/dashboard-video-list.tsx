"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, PencilLine, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSourceLabel, getThumbnailCandidates, getVisibilityLabel } from "@/lib/video-utils";
import { formatDateLabel } from "@/lib/helpers";
import type { VideoVisibility } from "@/lib/types";

interface DashboardVideoListProps {
  videos: Array<{
    id: string;
    title: string;
    source: string;
    sourceUrl: string;
    thumbnailUrl: string;
    visibility: VideoVisibility;
    publicSlug: string;
    createdAt: string;
  }>;
}

type VideoFilter = "all" | "draft" | "success";
const ITEMS_PER_PAGE = 6;

export function DashboardVideoList({ videos }: DashboardVideoListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<VideoFilter>("all");
  const [page, setPage] = useState(1);

  const filteredVideos = useMemo(() => {
    if (filter === "draft") {
      return videos.filter((video) => video.visibility === "draft");
    }
    if (filter === "success") {
      return videos.filter((video) => video.visibility === "public");
    }
    return videos;
  }, [filter, videos]);

  const totalPages = Math.max(1, Math.ceil(filteredVideos.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedVideos = filteredVideos.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Yakin ingin menghapus video ini? Tindakan ini tidak bisa dibatalkan."
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);

    const response = await fetch(`/api/videos/${id}`, {
      method: "DELETE",
    });

    setDeletingId(null);

    if (!response.ok) {
      window.alert("Gagal menghapus video. Coba lagi.");
      return;
    }

    router.refresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white/70 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              filter === "all"
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            Semua ({videos.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("draft");
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              filter === "draft"
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            Draft ({videos.filter((video) => video.visibility === "draft").length})
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("success");
              setPage(1);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              filter === "success"
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            Sukses ({videos.filter((video) => video.visibility === "public").length})
          </button>
        </div>
        <p className="text-xs font-medium text-slate-600">
          Halaman {currentPage} / {totalPages}
        </p>
      </div>

      {paginatedVideos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
          Belum ada video untuk filter ini.
        </div>
      ) : (
        paginatedVideos.map((video) => {
          const thumbnail = getThumbnailCandidates(video.sourceUrl, video.thumbnailUrl)[0] || "";
          return (
            <div
              key={video.id}
              className="rounded-xl border border-border bg-white/80 p-4 transition hover:border-brand-200 hover:shadow-soft"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                  {thumbnail ? (
                    <Image
                      src={thumbnail}
                      alt={`Thumbnail ${video.title}`}
                      width={160}
                      height={90}
                      className="h-[90px] w-[160px] object-cover"
                      unoptimized
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-[90px] w-[160px] items-center justify-center text-xs text-slate-500">
                      No thumbnail
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-900">
                    {video.title}
                  </h3>
                  <Badge>{getSourceLabel(video.source as never)}</Badge>
                  <Badge
                    className={
                      video.visibility === "public"
                        ? "bg-emerald-600"
                        : video.visibility === "private"
                          ? "bg-amber-500 text-slate-950"
                          : "bg-slate-700"
                    }
                  >
                    {getVisibilityLabel(video.visibility)}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">
                  {formatDateLabel(video.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {video.visibility === "public" ? (
                  <Link
                    href={`/v/${video.publicSlug}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Lihat Public Page
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-slate-600">
                    {video.visibility === "draft"
                      ? "Masih draft"
                      : "Tersimpan private"}
                  </span>
                )}
                <Link href={`/dashboard/videos/${video.id}`}>
                  <Button variant="secondary" size="sm" aria-label="Edit video" title="Edit video">
                    <PencilLine className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={deletingId === video.id}
                  onClick={() => handleDelete(video.id)}
                  aria-label="Hapus video"
                  title="Hapus video"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">
                    {deletingId === video.id ? "Menghapus video" : "Hapus video"}
                  </span>
                </Button>
              </div>
            </div>
            </div>
          );
        })
      )}

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white/70 p-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            Sebelumnya
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPage(item)}
                className={`h-8 min-w-8 rounded-md px-2 text-sm font-semibold transition ${
                  item === currentPage
                    ? "bg-brand-600 text-white"
                    : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Berikutnya
          </Button>
        </div>
      ) : null}
    </div>
  );
}
