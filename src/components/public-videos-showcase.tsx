"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, LayoutGrid, List, PlayCircle } from "lucide-react";
import { AvatarBadge } from "@/components/avatar-badge";
import { cn } from "@/lib/cn";
import { usePreferences } from "@/hooks/use-preferences";
import { getVideoSourceBadgeMeta } from "@/lib/video-source-badge";
import { getThumbnailCandidates } from "@/lib/video-utils";

const VIDEO_ROTATION_INTERVAL_MS = 10 * 60 * 1000;
const VIDEO_DEVICE_SEED_KEY = "videoport-all-video-seed-v1";

type ShowcaseVideo = {
  id: string;
  title: string;
  publicSlug: string;
  description: string;
  createdAt: string;
  sourceUrl: string;
  thumbnailUrl: string;
  author: {
    username: string | null;
    name: string | null;
    image: string | null;
  } | null;
};

function createSeededHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle<T extends { id: string }>(items: T[], seed: string): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const hash = createSeededHash(`${seed}-${result[index].id}-${index}`);
    const swapIndex = hash % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

export function PublicVideosShowcase({ videos }: { videos: ShowcaseVideo[] }) {
  const { locale } = usePreferences();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [deviceSeed, setDeviceSeed] = useState("videos-seed-default");
  const [timeBucket, setTimeBucket] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncSeed = () => {
      const fromStorage = window.localStorage.getItem(VIDEO_DEVICE_SEED_KEY);
      if (fromStorage) {
        setDeviceSeed(fromStorage);
        return;
      }

      const nextSeed =
        window.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      window.localStorage.setItem(VIDEO_DEVICE_SEED_KEY, nextSeed);
      setDeviceSeed(nextSeed);
    };

    const timeout = window.setTimeout(syncSeed, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const rotate = () => {
      setTimeBucket(Math.floor(Date.now() / VIDEO_ROTATION_INTERVAL_MS));
    };

    const initialSync = window.setTimeout(rotate, 0);
    const timer = window.setInterval(rotate, VIDEO_ROTATION_INTERVAL_MS);
    return () => {
      window.clearTimeout(initialSync);
      window.clearInterval(timer);
    };
  }, []);

  const rotatedVideos = useMemo(() => {
    if (!videos.length) {
      return [];
    }

    const seedBase = `${deviceSeed}-${timeBucket}`;
    return seededShuffle(videos, seedBase).slice(0, 6);
  }, [videos, deviceSeed, timeBucket]);

  return (
    <main className="min-h-screen bg-canvas pb-14 pt-8">
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
            {locale === "en" ? "All Videos" : "Semua Video"}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-slate-950 sm:text-4xl">
            {locale === "en"
              ? "Latest videos from creators"
              : "Video terbaru dari creator"}
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
            {locale === "en"
              ? "For user privacy, we only show part of the available video collection."
              : "Demi privasi pengguna, kami hanya menampilkan sebagian dari video yang ada."}
          </p>
        </div>

        <div className="mt-4 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition",
                viewMode === "grid"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              )}
              aria-label={locale === "en" ? "Grid view" : "Mode grid"}
            >
              <LayoutGrid className="h-4 w-4" />
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition",
                viewMode === "list"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              )}
              aria-label={locale === "en" ? "List view" : "Mode list"}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>
        </div>

        <div
          className={cn(
            "mt-5",
            viewMode === "grid"
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              : "mx-auto max-w-4xl space-y-3"
          )}
        >
          {rotatedVideos.length === 0 ? (
            <p className="text-center text-sm text-slate-600">
              {locale === "en" ? "No video yet." : "Belum ada video."}
            </p>
          ) : (
            rotatedVideos.map((video) => {
              const thumbnail =
                getThumbnailCandidates(video.sourceUrl, video.thumbnailUrl)[0] || "";
              const sourceMeta = getVideoSourceBadgeMeta(video.sourceUrl);

              return (
                <Link
                  key={video.id}
                  href={`/v/${video.publicSlug}`}
                  aria-label={`${locale === "en" ? "View video" : "Lihat video"} ${video.title}`}
                  className={cn(
                    "group flex min-w-0 flex-col gap-4 rounded-[1.2rem] border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-[0_16px_30px_rgba(37,99,235,0.12)] sm:p-5",
                    viewMode === "grid"
                      ? "h-full min-h-[392px]"
                      : ""
                  )}
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <p className="line-clamp-2 min-w-0 text-base font-semibold text-slate-950">
                      {video.title}
                    </p>
                    <span
                      className={cn(
                        "inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                        sourceMeta.className
                      )}
                    >
                      {sourceMeta.label}
                    </span>
                  </div>

                  <div className="flex min-w-0 items-center gap-2">
                    <AvatarBadge
                      name={video.author?.name || "Creator"}
                      avatarUrl={video.author?.image || ""}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-700">
                        {video.author?.name || "Creator"}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        @{video.author?.username || "creator"}
                      </p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={`Thumbnail ${video.title}`}
                        width={440}
                        height={248}
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="aspect-video h-full w-full object-cover"
                        unoptimized
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex aspect-video items-center justify-center bg-slate-100 text-sm font-medium text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <PlayCircle className="h-4 w-4 text-brand-600" />
                          Video
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
                    {video.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm transition group-hover:bg-brand-700"
                      title={locale === "en" ? "View video" : "Lihat video"}
                    >
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <span className="text-slate-500">
                      {new Intl.DateTimeFormat(locale === "en" ? "en-US" : "id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }).format(new Date(video.createdAt))}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
