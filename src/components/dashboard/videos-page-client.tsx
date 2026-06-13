"use client";

import Link from "next/link";
import { Film, Link2, Plus, UploadCloud, TrendingUp, Eye, FileVideo, Pin } from "lucide-react";
import useSWR from "swr";
import { DashboardVideoList } from "@/components/dashboard/dashboard-video-list";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/fetcher";
import { CACHE_KEYS, CACHE_TIMES } from "@/lib/swr-config";
import { VideoListSkeleton } from "@/components/loading-skeletons";
import type { VideoVisibility } from "@/lib/types";

type VideoItem = {
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
};

type VideosPageClientProps = {
  initialVideos: VideoItem[];
};

/**
 * Client wrapper untuk Videos page dengan SWR revalidation.
 * Menerima initial data dari server, lalu SWR menjaga data tetap fresh.
 */
export function VideosPageClient({ initialVideos }: VideosPageClientProps) {
  const { data: myVideos = initialVideos, isValidating } = useSWR<VideoItem[]>(
    CACHE_KEYS.VIDEOS,
    fetcher,
    {
      fallbackData: initialVideos,
      dedupingInterval: CACHE_TIMES.DYNAMIC,
      revalidateOnMount: false, // Sudah ada initial data dari server
      revalidateOnFocus: true,
    }
  );

  const publicReadyCount = myVideos.filter(
    (video) => video.visibility === "public" || video.visibility === "semi_private"
  ).length;
  const draftCount = myVideos.filter((video) => video.visibility === "draft").length;
  const pinnedCount = myVideos.filter((video) => video.pinnedToProfile).length;

  return (
    <div className="mx-auto max-w-[1440px] space-y-4 px-3 sm:px-0">
      {/* Header Section */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
        {/* Hero Card - spans 8 cols on desktop */}
        <div className="lg:col-span-8">
          <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-white via-white to-slate-50 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:rounded-3xl sm:p-7">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-zinc-100/60 to-transparent blur-2xl" />
            <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-gradient-to-tr from-slate-100/80 to-transparent blur-xl" />
            
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 backdrop-blur-sm">
                <UploadCloud className="h-3 w-3" />
                Video Portfolio
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Video Portfolio Creator
              </h1>
              <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-slate-500 sm:text-sm">
                Upload, kelola, dan hubungkan video terbaik ke Build Link dalam tampilan yang lebih compact.
              </p>
              <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                <Link href="/dashboard/videos/new">
                  <Button className="w-full rounded-xl bg-zinc-950 px-5 text-white shadow-md shadow-zinc-900/10 hover:bg-zinc-800 sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Upload Video
                  </Button>
                </Link>
                <Link href="/dashboard/link-builder">
                  <Button variant="secondary" className="w-full rounded-xl sm:w-auto">
                    <Link2 className="h-4 w-4" />
                    Hubungkan ke Build Link
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-4">
          <div className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:border-slate-200 hover:shadow-md sm:rounded-3xl sm:p-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-zinc-900 group-hover:text-white">
              <FileVideo className="h-4 w-4" />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {myVideos.length}
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Total Video
            </p>
          </div>

          <div className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:border-emerald-200 hover:shadow-md sm:rounded-3xl sm:p-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
              <Eye className="h-4 w-4" />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-emerald-700 sm:text-3xl">
              {publicReadyCount}
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Public Ready
            </p>
          </div>

          <div className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:border-slate-200 hover:shadow-md sm:rounded-3xl sm:p-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-500 group-hover:text-white">
              <TrendingUp className="h-4 w-4" />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {draftCount}
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Draft
            </p>
          </div>

          <div className="group rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:border-violet-200 hover:shadow-md sm:rounded-3xl sm:p-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 transition-colors group-hover:bg-violet-500 group-hover:text-white">
              <Pin className="h-4 w-4" />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-violet-700 sm:text-3xl">
              {pinnedCount}
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Pinned
            </p>
          </div>
        </div>
      </div>

      {/* Video Management Section */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:rounded-3xl sm:p-6">
        <div className="mb-4 flex flex-col gap-1.5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Video Management
            </p>
            <h2 className="mt-0.5 text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
              Daftar video portfolio
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {isValidating && (
              <span className="text-xs text-slate-400 animate-pulse">Syncing...</span>
            )}
            <p className="text-xs text-slate-400 sm:text-sm">
              Cari, filter, sort, dan pin maksimal 3 video ke Bio Link.
            </p>
          </div>
        </div>

        {myVideos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <Film className="h-6 w-6 text-slate-500" />
            </div>
            <p className="mt-4 text-base font-semibold text-slate-900">Belum ada video portfolio</p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
              Upload video pertama Anda atau hubungkan video dari Google Drive.
            </p>
            <Link href="/dashboard/videos/new" className="mt-5 inline-block">
              <Button className="rounded-xl bg-zinc-950 text-white shadow-md shadow-zinc-900/10 hover:bg-zinc-800">
                <Plus className="h-4 w-4" />
                Upload Video
              </Button>
            </Link>
          </div>
        ) : (
          <DashboardVideoList videos={myVideos} />
        )}
      </div>
    </div>
  );
}
