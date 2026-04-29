"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  LayoutGrid,
  Link2,
  List,
  PencilLine,
  Search,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatDateLabel } from "@/lib/helpers";
import type { VideoVisibility } from "@/lib/types";
import {
  getSourceLabel,
  getThumbnailCandidates,
  getVisibilityLabel,
} from "@/lib/video-utils";

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

type VideoFilter = "all" | "draft" | "public" | "semi_private" | "private";
type ViewMode = "grid" | "list";

const ITEMS_PER_PAGE = 6;

export function DashboardVideoList({ videos }: DashboardVideoListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<VideoFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const filteredVideos = useMemo(() => {
    const filteredByStatus =
      filter === "all"
        ? videos
        : videos.filter((video) => video.visibility === filter);

    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return filteredByStatus;
    }

    return filteredByStatus.filter((video) =>
      video.title.toLowerCase().includes(query)
    );
  }, [filter, searchQuery, videos]);

  const totalPages = Math.max(1, Math.ceil(filteredVideos.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedVideos = filteredVideos.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const draftCount = videos.filter((video) => video.visibility === "draft").length;
  const publicCount = videos.filter((video) => video.visibility === "public").length;
  const semiPrivateCount = videos.filter(
    (video) => video.visibility === "semi_private"
  ).length;
  const privateCount = videos.filter(
    (video) => video.visibility === "private"
  ).length;

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Yakin ingin menghapus video ini? Tindakan ini tidak bisa dibatalkan."
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    const response = await fetch(`/api/videos/${id}`, { method: "DELETE" });
    setDeletingId(null);

    if (!response.ok) {
      window.alert("Gagal menghapus video. Coba lagi.");
      return;
    }

    router.refresh();
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-white/80 p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFilter("all");
                setPage(1);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                filter === "all"
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              )}
            >
              Semua ({videos.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilter("draft");
                setPage(1);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                filter === "draft"
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              )}
            >
              Draft ({draftCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilter("public");
                setPage(1);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                filter === "public"
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              )}
            >
              Public ({publicCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilter("semi_private");
                setPage(1);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                filter === "semi_private"
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              )}
            >
              Semi Private ({semiPrivateCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilter("private");
                setPage(1);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                filter === "private"
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              )}
            >
              Private ({privateCount})
            </button>
          </div>
          <p className="text-xs font-medium text-slate-600">
            Halaman {currentPage} / {totalPages}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="relative block w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Cari judul video"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => {
                setViewMode("grid");
                setPage(1);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition",
                viewMode === "grid"
                  ? "bg-brand-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              )}
              aria-label="Mode grid"
            >
              <LayoutGrid className="h-4 w-4" />
              Grid
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("list");
                setPage(1);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition",
                viewMode === "list"
                  ? "bg-brand-600 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              )}
              aria-label="Mode list"
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>
        </div>
      </div>

      {paginatedVideos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
          Belum ada video untuk filter atau pencarian ini.
        </div>
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
              : "space-y-3"
          )}
        >
          {paginatedVideos.map((video) => {
            const thumbnail =
              getThumbnailCandidates(video.sourceUrl, video.thumbnailUrl)[0] || "";

            return (
              <article
                key={video.id}
                className={cn(
                  "rounded-xl border border-border bg-white/85 p-3 transition hover:border-brand-200 hover:shadow-soft",
                  viewMode === "grid" ? "flex h-full min-h-[292px] flex-col" : ""
                )}
                >
                  <div
                    className={cn(
                      viewMode === "list"
                        ? "flex flex-col gap-3 sm:flex-row sm:items-start"
                      : "flex h-full flex-col gap-3"
                    )}
                  >
                  {viewMode === "grid" ? (
                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      {thumbnail ? (
                        <Image
                          src={thumbnail}
                          alt={`Thumbnail ${video.title}`}
                          width={320}
                          height={180}
                          className="aspect-video h-full w-full object-cover"
                          unoptimized
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex aspect-video w-full items-center justify-center text-xs text-slate-500">
                          No thumbnail
                        </div>
                      )}
                    </div>
                  ) : null}

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="line-clamp-2 text-base font-semibold text-slate-900">
                        {video.title}
                      </h3>
                      <Badge>{getSourceLabel(video.source as never)}</Badge>
                      <Badge
                        className={
                          video.visibility === "public"
                            ? "bg-emerald-50 text-emerald-600"
                            : video.visibility === "semi_private"
                              ? "bg-slate-100 text-slate-700"
                            : video.visibility === "private"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-500"
                        }
                      >
                        {getVisibilityLabel(video.visibility)}
                      </Badge>
                    </div>

                    <p className="mt-1 text-sm text-slate-600">
                      {formatDateLabel(video.createdAt)}
                    </p>

                    {viewMode === "list" ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {getSourceLabel(video.source as never)} · {getVisibilityLabel(video.visibility)}
                      </p>
                    ) : null}

                    <div
                      className={cn(
                        "mt-3 flex flex-wrap items-center gap-2",
                        viewMode === "grid" ? "justify-center" : "sm:justify-end"
                      )}
                    >
                      {video.visibility === "public" ||
                      video.visibility === "semi_private" ? (
                        <Link href={`/v/${video.publicSlug}`}>
                          <Button
                            variant="secondary"
                            size="sm"
                            aria-label="Lihat public page"
                            title="Lihat public page"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      ) : (
                        <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600">
                          {video.visibility === "draft"
                            ? "Masih draft"
                            : "Tersimpan private"}
                        </span>
                      )}

                      <Link href={`/dashboard/videos/${video.id}`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          aria-label="Edit video"
                          title="Edit video"
                        >
                          <PencilLine className="h-4 w-4" />
                        </Button>
                      </Link>

                      <Link href="/dashboard/link-builder">
                        <Button
                          variant="secondary"
                          size="sm"
                          aria-label="Tambahkan ke Build Link"
                          title="Tambahkan ke Build Link"
                        >
                          <Link2 className="h-4 w-4" />
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
              </article>
            );
          })}
        </div>
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
                className={cn(
                  "h-8 min-w-8 rounded-md px-2 text-sm font-semibold transition",
                  item === currentPage
                    ? "bg-brand-600 text-white"
                    : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                )}
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
