"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Copy,
  Film,
  LayoutGrid,
  Link2,
  List,
  PencilLine,
  Pin,
  PinOff,
  Search,
  SlidersHorizontal,
  Trash2,
  ChevronLeft,
  ChevronRight,
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
    pinnedToProfile: boolean;
    pinnedOrder: number;
    publicSlug: string;
    createdAt: string;
  }>;
}

type VideoFilter = "all" | "draft" | "public" | "semi_private" | "private";
type ViewMode = "grid" | "list";
type SortMode = "newest" | "oldest" | "title_az" | "title_za" | "status" | "pinned";
type SourceFilter = "all" | string;

const ITEMS_PER_PAGE = 12;

const statusOrder: Record<VideoVisibility, number> = {
  public: 1,
  semi_private: 2,
  draft: 3,
  private: 4,
};

const filterItems: Array<{ value: VideoFilter; label: string }> = [
  { value: "all", label: "Semua" },
  { value: "draft", label: "Draft" },
  { value: "public", label: "Public" },
  { value: "semi_private", label: "Semi Private" },
  { value: "private", label: "Private" },
];

function getStatusClass(visibility: VideoVisibility) {
  if (visibility === "public") return "border-emerald-200/60 bg-emerald-50 text-emerald-700";
  if (visibility === "semi_private") return "border-sky-200/60 bg-sky-50 text-sky-700";
  if (visibility === "private") return "border-amber-200/60 bg-amber-50 text-amber-700";
  return "border-slate-200/60 bg-slate-50 text-slate-600";
}

export function DashboardVideoList({ videos }: DashboardVideoListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pinningId, setPinningId] = useState<string | null>(null);
  const [pinError, setPinError] = useState("");
  const [filter, setFilter] = useState<VideoFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const counts = useMemo(
    () => ({
      all: videos.length,
      draft: videos.filter((video) => video.visibility === "draft").length,
      public: videos.filter((video) => video.visibility === "public").length,
      semi_private: videos.filter((video) => video.visibility === "semi_private").length,
      private: videos.filter((video) => video.visibility === "private").length,
      pinned: videos.filter((video) => video.pinnedToProfile).length,
    }),
    [videos]
  );

  const sourceOptions = useMemo(
    () => Array.from(new Set(videos.map((video) => video.source).filter(Boolean))),
    [videos]
  );

  const filteredVideos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return videos
      .filter((video) => filter === "all" || video.visibility === filter)
      .filter((video) => sourceFilter === "all" || video.source === sourceFilter)
      .filter((video) => !query || video.title.toLowerCase().includes(query))
      .toSorted((a, b) => {
        if (sortMode === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortMode === "title_az") return a.title.localeCompare(b.title);
        if (sortMode === "title_za") return b.title.localeCompare(a.title);
        if (sortMode === "status") return statusOrder[a.visibility] - statusOrder[b.visibility];
        if (sortMode === "pinned") {
          if (a.pinnedToProfile !== b.pinnedToProfile) return a.pinnedToProfile ? -1 : 1;
          return (a.pinnedOrder || 99) - (b.pinnedOrder || 99);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [filter, searchQuery, sortMode, sourceFilter, videos]);

  const totalPages = Math.max(1, Math.ceil(filteredVideos.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedVideos = filteredVideos.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleTogglePin = async (video: DashboardVideoListProps["videos"][number]) => {
    setPinError("");
    setPinningId(video.id);
    const response = await fetch("/api/videos/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: video.id, pinned: !video.pinnedToProfile }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setPinningId(null);

    if (!response.ok) {
      setPinError(payload?.error || "Gagal memperbarui pin video.");
      return;
    }

    router.refresh();
  };

  const handleCopy = async (video: DashboardVideoListProps["videos"][number]) => {
    const url = `${window.location.origin}/v/${video.publicSlug}`;
    await navigator.clipboard.writeText(url).catch(() => undefined);
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Hapus video ini? Video akan dihapus dari dashboard dan tidak akan tampil di Build Link."
    );

    if (!confirmed) return;

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
      {/* Filter & Controls */}
      <div className="space-y-3">
        {/* Tab Filters */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1 overflow-x-auto scrollbar-none">
            <div className="flex min-w-max items-center gap-1.5 pb-0.5">
              {filterItems.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setFilter(item.value);
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-xl px-3 py-2 text-xs font-semibold transition-all sm:text-sm",
                    filter === item.value
                      ? "bg-zinc-900 text-white shadow-sm"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  {item.label} ({counts[item.value]})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pinned Info Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-[11px] font-semibold text-violet-700">
            <Pin className="h-3 w-3" />
            Pinned to Bio Link {counts.pinned}/3
          </span>
          <span className="text-xs text-slate-400">
            · {filteredVideos.length} hasil
          </span>
        </div>

        {/* Search & Sort Controls */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_160px_150px_auto]">
          <label className="relative block">
            <span className="sr-only">Cari judul video</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Cari judul video..."
              className="h-10 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-100"
            />
          </label>

          <label className="relative block">
            <span className="sr-only">Sort by</span>
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <select
              value={sortMode}
              onChange={(event) => {
                setSortMode(event.target.value as SortMode);
                setPage(1);
              }}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200/80 bg-slate-50/50 pl-9 pr-8 text-sm font-medium text-slate-700 outline-none transition focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-100"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="title_az">Judul A-Z</option>
              <option value="title_za">Judul Z-A</option>
              <option value="status">Status</option>
              <option value="pinned">Pinned first</option>
            </select>
          </label>

          <select
            value={sourceFilter}
            onChange={(event) => {
              setSourceFilter(event.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-100"
            aria-label="Filter source video"
          >
            <option value="all">Semua source</option>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {getSourceLabel(source as never)}
              </option>
            ))}
          </select>

          <div className="inline-flex h-10 items-center gap-0.5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-1">
            <button
              type="button"
              onClick={() => {
                setViewMode("grid");
                setPage(1);
              }}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-all",
                viewMode === "grid"
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-slate-500 hover:bg-white hover:text-slate-700"
              )}
              aria-label="Mode grid"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("list");
                setPage(1);
              }}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-all",
                viewMode === "list"
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-slate-500 hover:bg-white hover:text-slate-700"
              )}
              aria-label="Mode list"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pin Error */}
      {pinError ? (
        <div className="rounded-xl border border-rose-200/60 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {pinError}
        </div>
      ) : null}

      {/* Video Cards */}
      {paginatedVideos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center sm:p-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
            <Film className="h-5 w-5 text-slate-500" />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-900">Tidak ada video yang cocok</p>
          <p className="mt-1 text-xs text-slate-500">Coba gunakan kata kunci lain atau ubah filter status.</p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
              : "space-y-2.5"
          )}
        >
          {paginatedVideos.map((video) => {
            const thumbnail = getThumbnailCandidates(video.sourceUrl, video.thumbnailUrl)[0] || "";
            const isPinnable = video.visibility === "public" || video.visibility === "semi_private";

            if (viewMode === "grid") {
              return (
                <article
                  key={video.id}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:border-slate-200 hover:shadow-md"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden bg-slate-100">
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={`Thumbnail ${video.title}`}
                        width={360}
                        height={202}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        unoptimized
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-medium text-slate-400">
                        <Film className="mr-1.5 h-4 w-4" />
                        No thumbnail
                      </div>
                    )}
                    {/* Status Badge Overlay */}
                    <div className="absolute left-2.5 top-2.5">
                      <Badge className={cn("border text-[10px] font-semibold backdrop-blur-sm", getStatusClass(video.visibility))}>
                        {getVisibilityLabel(video.visibility)}
                      </Badge>
                    </div>
                    {video.pinnedToProfile && (
                      <div className="absolute right-2.5 top-2.5">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-violet-600/90 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                          <Pin className="h-2.5 w-2.5" />
                          #{video.pinnedOrder || 1}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-3.5">
                    <div className="flex-1">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-slate-900">
                        {video.title}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Badge className="text-[10px]">{getSourceLabel(video.source as never)}</Badge>
                        <span className="text-[11px] text-slate-400">{formatDateLabel(video.createdAt)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3">
                      {isPinnable && (
                        <Link href={`/v/${video.publicSlug}`}>
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                            title="Preview video"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                      )}
                      <Link href={`/dashboard/videos/${video.id}`}>
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                          title="Edit video"
                        >
                          <PencilLine className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleCopy(video)}
                        disabled={!isPinnable}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                        title="Copy link video"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={pinningId === video.id || !isPinnable || (!video.pinnedToProfile && counts.pinned >= 3)}
                        onClick={() => handleTogglePin(video)}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg transition disabled:opacity-40",
                          video.pinnedToProfile
                            ? "bg-violet-50 text-violet-600 hover:bg-violet-100"
                            : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        )}
                        title={video.pinnedToProfile ? "Lepas pin Bio Link" : "Pin ke Bio Link"}
                      >
                        {video.pinnedToProfile ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                      </button>
                      <Link href="/dashboard/link-builder">
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                          title="Hubungkan ke Build Link"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                      <button
                        type="button"
                        disabled={deletingId === video.id}
                        onClick={() => handleDelete(video.id)}
                        className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500 transition hover:bg-rose-100 hover:text-rose-600 disabled:opacity-40"
                        title="Hapus video"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            }

            // List View
            return (
              <article
                key={video.id}
                className="group rounded-xl border border-slate-100 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all hover:border-slate-200 hover:shadow-md sm:rounded-2xl sm:p-4"
              >
                <div className="grid gap-3 sm:grid-cols-[100px_1fr_auto] sm:items-center">
                  {/* Thumbnail */}
                  <div className="relative h-16 overflow-hidden rounded-xl border border-slate-100 bg-slate-100 sm:h-14">
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={`Thumbnail ${video.title}`}
                        width={160}
                        height={90}
                        className="h-full w-full object-cover"
                        unoptimized
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-slate-400">
                        <Film className="mr-1 h-3 w-3" />
                        No thumb
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="line-clamp-1 text-sm font-semibold tracking-tight text-slate-900">
                        {video.title}
                      </h3>
                      <Badge className={cn("border text-[10px]", getStatusClass(video.visibility))}>
                        {getVisibilityLabel(video.visibility)}
                      </Badge>
                      {video.pinnedToProfile && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-600">
                          <Pin className="h-2.5 w-2.5" />
                          #{video.pinnedOrder || 1}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                      <Badge className="text-[10px]">{getSourceLabel(video.source as never)}</Badge>
                      <span>{formatDateLabel(video.createdAt)}</span>
                      <span className="hidden sm:inline">·</span>
                      <span className="hidden sm:inline">{isPinnable ? "Siap dipin" : "Belum bisa dipin"}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                    {isPinnable && (
                      <Link href={`/v/${video.publicSlug}`}>
                        <button
                          type="button"
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                          title="Preview video"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </Link>
                    )}
                    <Link href={`/dashboard/videos/${video.id}`}>
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        title="Edit video"
                      >
                        <PencilLine className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleCopy(video)}
                      disabled={!isPinnable}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                      title="Copy link video"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={pinningId === video.id || !isPinnable || (!video.pinnedToProfile && counts.pinned >= 3)}
                      onClick={() => handleTogglePin(video)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition disabled:opacity-40",
                        video.pinnedToProfile
                          ? "bg-violet-50 text-violet-600 hover:bg-violet-100"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      )}
                      title={video.pinnedToProfile ? "Lepas pin Bio Link" : "Pin ke Bio Link"}
                    >
                      {video.pinnedToProfile ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </button>
                    <Link href="/dashboard/link-builder">
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        title="Hubungkan ke Build Link"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                    <button
                      type="button"
                      disabled={deletingId === video.id}
                      onClick={() => handleDelete(video.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-500 transition hover:bg-rose-100 hover:text-rose-600 disabled:opacity-40"
                      title="Hapus video"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-50 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Sebelumnya
          </button>
          <p className="text-xs font-semibold text-slate-500">
            {currentPage} / {totalPages}
          </p>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-50 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
          >
            Berikutnya
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
