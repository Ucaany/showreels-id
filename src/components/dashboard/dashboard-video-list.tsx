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
  if (visibility === "public") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (visibility === "semi_private") return "border-slate-200 bg-slate-100 text-slate-800";
  if (visibility === "private") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-white text-slate-600";
}

export function DashboardVideoList({ videos }: DashboardVideoListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pinningId, setPinningId] = useState<string | null>(null);
  const [pinError, setPinError] = useState("");
  const [filter, setFilter] = useState<VideoFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
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
    <div className="space-y-4">
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/5 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1 overflow-x-auto pb-1">
            <div className="flex min-w-max items-center gap-2">
              {filterItems.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setFilter(item.value);
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-full px-3.5 py-2 text-sm font-semibold transition",
                    filter === item.value
                      ? "bg-zinc-950 text-white shadow-sm shadow-slate-900/10"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {item.label} ({counts[item.value]})
                </button>
              ))}
            </div>
          </div>
          <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
            Pinned to Bio Link {counts.pinned}/3 · {filteredVideos.length} hasil
          </p>
        </div>

        <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(260px,1fr)_180px_170px_auto]">
          <label className="relative block">
            <span className="sr-only">Cari judul video</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Cari judul video..."
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
            />
          </label>

          <label className="relative block">
            <span className="sr-only">Sort by</span>
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={sortMode}
              onChange={(event) => {
                setSortMode(event.target.value as SortMode);
                setPage(1);
              }}
              className="h-11 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-9 pr-8 text-sm font-medium text-slate-800 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
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
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
            aria-label="Filter source video"
          >
            <option value="all">Semua source</option>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {getSourceLabel(source as never)}
              </option>
            ))}
          </select>

          <div className="inline-flex h-11 items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => {
                setViewMode("grid");
                setPage(1);
              }}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition",
                viewMode === "grid" ? "bg-zinc-950 text-white" : "text-slate-600 hover:bg-white"
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
                "inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition",
                viewMode === "list" ? "bg-zinc-950 text-white" : "text-slate-600 hover:bg-white"
              )}
              aria-label="Mode list"
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>
        </div>
      </div>

      {pinError ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {pinError}
        </p>
      ) : null}

      {paginatedVideos.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
          <Film className="mx-auto h-9 w-9 text-slate-700" />
          <p className="mt-3 font-semibold text-slate-900">Tidak ada video yang cocok</p>
          <p className="mt-1">Coba gunakan kata kunci lain atau ubah filter status.</p>
        </div>
      ) : (
        <div className={cn(viewMode === "grid" ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "space-y-3")}>
          {paginatedVideos.map((video) => {
            const thumbnail = getThumbnailCandidates(video.sourceUrl, video.thumbnailUrl)[0] || "";
            const isPinnable = video.visibility === "public" || video.visibility === "semi_private";

            return (
              <article
                key={video.id}
                className={cn(
                  "rounded-[1.35rem] border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/5 transition hover:border-zinc-300 hover:shadow-md",
                  viewMode === "grid" ? "flex h-full flex-col" : ""
                )}
              >
                <div className={cn(viewMode === "list" ? "grid gap-3 sm:grid-cols-[112px_1fr_auto] sm:items-center" : "flex h-full flex-col gap-3")}>
                  <div className={cn("relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100", viewMode === "list" ? "h-20 sm:h-16" : "aspect-video")}>
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={`Thumbnail ${video.title}`}
                        width={360}
                        height={202}
                        className="h-full w-full object-cover"
                        unoptimized
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-medium text-slate-500">
                        <Film className="mr-1.5 h-4 w-4" />
                        No thumbnail
                      </div>
                    )}
                    {viewMode === "grid" ? (
                      <Badge className={cn("absolute left-2 top-2 border", getStatusClass(video.visibility))}>
                        {getVisibilityLabel(video.visibility)}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="line-clamp-2 text-base font-semibold tracking-[-0.02em] text-slate-950">
                        {video.title}
                      </h3>
                      <Badge>{getSourceLabel(video.source as never)}</Badge>
                      {viewMode === "list" ? (
                        <Badge className={cn("border", getStatusClass(video.visibility))}>
                          {getVisibilityLabel(video.visibility)}
                        </Badge>
                      ) : null}
                      {video.pinnedToProfile ? (
                        <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">
                          Pinned #{video.pinnedOrder || 1}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{formatDateLabel(video.createdAt)}</p>
                    <p className="mt-1 text-xs text-slate-500">{getSourceLabel(video.source as never)} · {isPinnable ? "Siap dipin ke Build Link" : "Belum bisa dipin"}</p>
                  </div>

                  <div className={cn("flex flex-wrap items-center gap-2", viewMode === "grid" ? "mt-auto" : "sm:justify-end")}>
                    {isPinnable ? (
                      <Link href={`/v/${video.publicSlug}`}>
                        <Button variant="secondary" size="sm" aria-label="Preview video" title="Preview video">
                          <ArrowUpRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : null}
                    <Link href={`/dashboard/videos/${video.id}`}>
                      <Button variant="secondary" size="sm" aria-label="Edit video" title="Edit video">
                        <PencilLine className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="secondary" size="sm" onClick={() => handleCopy(video)} aria-label="Copy link video" title="Copy link video" disabled={!isPinnable}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pinningId === video.id || !isPinnable || (!video.pinnedToProfile && counts.pinned >= 3)}
                      onClick={() => handleTogglePin(video)}
                      aria-label={video.pinnedToProfile ? "Lepas pin Bio Link" : "Pin ke Bio Link"}
                      title={video.pinnedToProfile ? "Lepas pin Bio Link" : isPinnable ? "Pin ke Bio Link" : "Hanya Public atau Semi Private yang bisa dipin"}
                    >
                      {video.pinnedToProfile ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </Button>
                    <Link href="/dashboard/link-builder">
                      <Button variant="secondary" size="sm" aria-label="Hubungkan ke Build Link" title="Hubungkan ke Build Link">
                        <Link2 className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="danger" size="sm" disabled={deletingId === video.id} onClick={() => handleDelete(video.id)} aria-label="Hapus video" title="Hapus video">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] border border-slate-200 bg-white p-3 shadow-sm shadow-slate-900/5">
          <Button variant="secondary" size="sm" disabled={currentPage <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
            Sebelumnya
          </Button>
          <p className="text-sm font-semibold text-slate-600">Halaman {currentPage} / {totalPages}</p>
          <Button variant="secondary" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
            Berikutnya
          </Button>
        </div>
      ) : null}
    </div>
  );
}
