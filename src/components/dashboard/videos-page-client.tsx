"use client";

import Link from "next/link";
import { Film, Link2, Plus, UploadCloud, TrendingUp, Eye, FileVideo, Pin } from "lucide-react";
import useSWR from "swr";
import { DashboardVideoList } from "@/components/dashboard/dashboard-video-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function VideosPageClient({ initialVideos }: VideosPageClientProps) {
  const { data: myVideos = initialVideos, isValidating } = useSWR<VideoItem[]>(
    CACHE_KEYS.VIDEOS,
    fetcher,
    {
      fallbackData: initialVideos,
      dedupingInterval: CACHE_TIMES.DYNAMIC,
      revalidateOnMount: false,
      revalidateOnFocus: true,
    }
  );

  const publicReadyCount = myVideos.filter(
    (v) => v.visibility === "public" || v.visibility === "semi_private"
  ).length;
  const draftCount = myVideos.filter((v) => v.visibility === "draft").length;
  const pinnedCount = myVideos.filter((v) => v.pinnedToProfile).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola video portfolio, pin ke Bio Link, dan hubungkan ke Build Link.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href="/dashboard/videos/new">
            <Button variant="default" className="gap-2">
              <Plus className="h-4 w-4" />
              Upload Video
            </Button>
          </Link>
          <Link href="/dashboard/link-builder">
            <Button variant="outline" className="gap-2">
              <Link2 className="h-4 w-4" />
              Build Link
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <FileVideo className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{myVideos.length}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Total Video</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <Eye className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums text-emerald-600">{publicReadyCount}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Public Ready</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <TrendingUp className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">{draftCount}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Draft</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
              <Pin className="h-4 w-4 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums text-violet-600">{pinnedCount}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Pinned</p>
          </CardContent>
        </Card>
      </div>

      {/* Video List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
          <div>
            <CardTitle className="text-base">Daftar Video</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Filter, sort, dan pin maksimal 3 video ke Bio Link.
            </p>
          </div>
          {isValidating && (
            <span className="text-xs text-muted-foreground animate-pulse">Syncing...</span>
          )}
        </CardHeader>
        <CardContent>
          {myVideos.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <Film className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-semibold">Belum ada video portfolio</p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                Upload video pertama kamu atau hubungkan video dari platform lain.
              </p>
              <Link href="/dashboard/videos/new" className="mt-5 inline-block">
                <Button variant="default" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Upload Video
                </Button>
              </Link>
            </div>
          ) : (
            <DashboardVideoList videos={myVideos} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
