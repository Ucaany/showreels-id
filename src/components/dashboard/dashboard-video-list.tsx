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
  { value: "public", label: "Public" },
  { value: "semi_private", label: "Semi Private" },
  { value: "draft", label: "Draft" },
  { value: "private", label: "Private" },
];

function VisibilityBadge({ visibility }: { visibility: VideoVisibility }) {
  const variants: Record<VideoVisibility, string> = {
    public: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    semi_private: "bg-sky-50 text-sky-700 border-sky-200/60",
    draft: "bg-muted text-muted-foreground border-border",
    private: "bg-amber-50 text-amber-700 border-amber-200/60",
  };
  return (
    <span className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold", variants[visibility])}>
      {getVisibilityLabel(visibility)}
    </span>
  );
}

function ActionButton({
  onClick,
  disabled,
  title,
  className,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40",
        className
      )}
    >
      {children}
    </button>
  );
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
      draft: videos.filter((v) => v.visibility === "draft").length,
      public: videos.filter((v) => v.visibility === "public").length,
      semi_private: videos.filter((v) => v.visibility === "semi_private").length,
      private: videos.filter((v) => v.visibility === "private").length,
      pinned: videos.filter((v) => v.pinnedToProfile).length,
    }),
    [videos]
  );

  const sourceOptions = useMemo(
    () => Array.from(new Set(videos.map((v) => v.source).filter(Boolean))),
    [videos]
  );

  const filteredVideos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return videos
      .filter((v) => filter === "all" || v.visibility === filter)
      .filter((v) => sourceFilter === "all" || v.source === sourceFilter)
      .filter((v) => !query || v.title.toLowerCase().includes(query))
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
    const confirmed = window.confirm("Hapus video ini? Video akan dihapus dari dashboard dan tidak akan tampil di Build Link.");
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
    <div className="min-w-0 space-y-4">
      {/* Controls */}
      <div className="space-y-3">
        {/* Status Filters */}
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          {filterItems.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => { setFilter(item.value); setPage(1); }}
              className={cn(
                "inline-flex shrink-0 items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                filter === item.value
                  ? "border-foreground bg-foreground text-background shadow-sm"
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              {item.label}
              <span className={cn("ml-1.5 rounded-full px-1 py-0.5 text-[10px] font-semibold", filter === item.value ? "bg-background/20" : "bg-muted text-muted-foreground")}>
                {counts[item.value]}
              </span>
            </button>
          ))}
        </div>

        {/* Search + Sort + Source + View toggle */}
        <div className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_160px_150px_auto]">
          <label className="relative block">
            <span className="sr-only">Cari judul video</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Cari judul video..."
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
          </label>

          <label className="relative block">
            <span className="sr-only">Urutkan</span>
            <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={sortMode}
              onChange={(e) => { setSortMode(e.target.value as SortMode); setPage(1); }}
              className="h-10 w-full appearance-none rounded-lg border border-input bg-background pl-9 pr-8 text-sm font-medium text-foreground outline-none transition focus:ring-2 focus:ring-ring"
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
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            aria-label="Filter source video"
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground outline-none transition focus:ring-2 focus:ring-ring"
          >
            <option value="all">Semua source</option>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>{getSourceLabel(source as never)}</option>
            ))}
          </select>

          <div className="inline-flex h-10 items-center gap-0.5 rounded-lg border border-input bg-background p-1">
            <button
              type="button"
              onClick={() => { setViewMode("grid"); setPage(1); }}
              aria-label="Mode grid"
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition",
                viewMode === "grid" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => { setViewMode("list"); setPage(1); }}
              aria-label="Mode list"
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition",
                viewMode === "list" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-700">
            <Pin className="h-3 w-3" />
            Pinned {counts.pinned}/3
          </span>
          <span>{filteredVideos.length} video</span>
        </div>
      </div>

      {/* Pin Error */}
      {pinError && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive">
          {pinError}
        </div>
      )}

      {/* Empty state */}
      {paginatedVideos.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
            <Film className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm font-semibold">Tidak ada video yang cocok</p>
          <p className="mt-1 text-xs text-muted-foreground">Coba gunakan kata kunci lain atau ubah filter status.</p>
        </div>
      ) : (
        <div className={cn(
          viewMode === "grid"
            ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
            : "space-y-2"
        )}>
          {paginatedVideos.map((video) => {
            const thumbnail = getThumbnailCandidates(video.sourceUrl, video.thumbnailUrl)[0] || "";
            const isPinnable = video.visibility === "public" || video.visibility === "semi_private";

            if (viewMode === "grid") {
              return (
                <article
                  key={video.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition hover:shadow-md"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden bg-muted">
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
                      <div className="flex h-full w-full items-center justify-center gap-1.5 text-xs text-muted-foreground">
                        <Film className="h-4 w-4" />
                        No thumbnail
                      </div>
                    )}
                    <div className="absolute left-2 top-2">
                      <VisibilityBadge visibility={video.visibility} />
                    </div>
                    {video.pinnedToProfile && (
                      <div className="absolute right-2 top-2">
                        <span className="inline-flex items-center gap-1 rounded-md bg-violet-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                          <Pin className="h-2.5 w-2.5" />#{video.pinnedOrder || 1}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-3">
                    <h3 className="line-clamp-2 flex-1 text-sm font-semibold leading-snug tracking-tight">
                      {video.title}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{getSourceLabel(video.source as never)}</Badge>
                      <span className="text-[11px] text-muted-foreground">{formatDateLabel(video.createdAt)}</span>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
                      {isPinnable && (
                        <ActionButton title="Preview video">
                          <Link href={`/v/${video.publicSlug}`} target="_blank" rel="noopener noreferrer">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </ActionButton>
                      )}
                      <Link href={`/dashboard/videos/${video.id}`}>
                        <ActionButton title="Edit video">
                          <PencilLine className="h-3.5 w-3.5" />
                        </ActionButton>
                      </Link>
                      <ActionButton
                        onClick={() => handleCopy(video)}
                        disabled={!isPinnable}
                        title="Copy link video"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </ActionButton>
                      <ActionButton
                        disabled={pinningId === video.id || !isPinnable || (!video.pinnedToProfile && counts.pinned >= 3)}
                        onClick={() => handleTogglePin(video)}
                        title={video.pinnedToProfile ? "Lepas pin Bio Link" : "Pin ke Bio Link"}
                        className={video.pinnedToProfile ? "border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100" : ""}
                      >
                        {video.pinnedToProfile ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                      </ActionButton>
                      <Link href="/dashboard/link-builder">
                        <ActionButton title="Hubungkan ke Build Link">
                          <Link2 className="h-3.5 w-3.5" />
                        </ActionButton>
                      </Link>
                      <ActionButton
                        disabled={deletingId === video.id}
                        onClick={() => handleDelete(video.id)}
                        title="Hapus video"
                        className="ml-auto border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </ActionButton>
                    </div>
                  </div>
                </article>
              );
            }

            // List View
            return (
              <article
                key={video.id}
                className="group min-w-0 rounded-xl border border-border bg-card p-3 transition hover:shadow-sm sm:p-4"
              >
                <div className="grid min-w-0 gap-3 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-center">
                  {/* Thumbnail */}
                  <div className="relative h-14 overflow-hidden rounded-lg border border-border bg-muted">
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
                      <div className="flex h-full w-full items-center justify-center gap-1 text-[10px] text-muted-foreground">
                        <Film className="h-3 w-3" />No thumb
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="line-clamp-1 text-sm font-semibold tracking-tight">{video.title}</h3>
                      <VisibilityBadge visibility={video.visibility} />
                      {video.pinnedToProfile && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-600">
                          <Pin className="h-2.5 w-2.5" />#{video.pinnedOrder || 1}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px]">{getSourceLabel(video.source as never)}</Badge>
                      <span>{formatDateLabel(video.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                    {isPinnable && (
                      <Link href={`/v/${video.publicSlug}`} target="_blank" rel="noopener noreferrer">
                        <ActionButton title="Preview video"><ArrowUpRight className="h-3.5 w-3.5" /></ActionButton>
                      </Link>
                    )}
                    <Link href={`/dashboard/videos/${video.id}`}>
                      <ActionButton title="Edit video"><PencilLine className="h-3.5 w-3.5" /></ActionButton>
                    </Link>
                    <ActionButton onClick={() => handleCopy(video)} disabled={!isPinnable} title="Copy link">
                      <Copy className="h-3.5 w-3.5" />
                    </ActionButton>
                    <ActionButton
                      disabled={pinningId === video.id || !isPinnable || (!video.pinnedToProfile && counts.pinned >= 3)}
                      onClick={() => handleTogglePin(video)}
                      title={video.pinnedToProfile ? "Lepas pin" : "Pin ke Bio Link"}
                      className={video.pinnedToProfile ? "border-violet-200 bg-violet-50 text-violet-600 hover:bg-violet-100" : ""}
                    >
                      {video.pinnedToProfile ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </ActionButton>
                    <Link href="/dashboard/link-builder">
                      <ActionButton title="Build Link"><Link2 className="h-3.5 w-3.5" /></ActionButton>
                    </Link>
                    <ActionButton
                      disabled={deletingId === video.id}
                      onClick={() => handleDelete(video.id)}
                      title="Hapus video"
                      className="border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </ActionButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-2.5">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="gap-1.5"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Sebelumnya
          </Button>
          <p className="text-xs font-medium text-muted-foreground">
            {currentPage} / {totalPages}
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="gap-1.5"
          >
            Berikutnya
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
