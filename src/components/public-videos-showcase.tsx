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
const VIDEO_DEVICE_SEED_KEY = "showreels-all-video-seed-v1";

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
  const [isDesktop, setIsDesktop] = useState(false);
  const [deviceSeed, setDeviceSeed] = useState("videos-seed-default");
  const [timeBucket, setTimeBucket] = useState(0);

  useEffect(() => {
    const syncViewport = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

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
  const effectiveViewMode: "grid" | "list" = isDesktop ? viewMode : "grid";

  return (
    <main className="min-h-screen bg-canvas pb-14 pt-8">
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e24f3b]">
            {locale === "en" ? "All Videos" : "Semua Video"}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-[#201b18] sm:text-4xl">
            {locale === "en"
              ? "Latest videos from creators"
              : "Video terbaru dari creator"}
          </h1>
          <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-[#5f524b]">
            {locale === "en"
              ? "For user privacy, we only show part of the available video collection."
              : "Demi privasi pengguna, kami hanya menampilkan sebagian dari video yang ada."}
          </p>
        </div>

        <div className="mt-4 hidden justify-center lg:flex">
          <div className="inline-flex items-center gap-1 rounded-full border border-[#ddd3cd] bg-white/95 p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition",
                effectiveViewMode === "grid"
                  ? "bg-[#1a1412] text-white shadow-sm"
                  : "text-[#5f524b] hover:bg-[#f3ece7]"
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
                effectiveViewMode === "list"
                  ? "bg-[#1a1412] text-white shadow-sm"
                  : "text-[#5f524b] hover:bg-[#f3ece7]"
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
            effectiveViewMode === "grid"
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              : "mx-auto max-w-3xl space-y-2.5"
          )}
        >
          {rotatedVideos.length === 0 ? (
            <p className="text-center text-sm text-[#5f524b]">
              {locale === "en" ? "No video yet." : "Belum ada video."}
            </p>
          ) : (
            rotatedVideos.map((video) => {
              const thumbnail =
                getThumbnailCandidates(video.sourceUrl, video.thumbnailUrl)[0] || "";
              const sourceMeta = getVideoSourceBadgeMeta(video.sourceUrl);
              const postedAtLabel = new Intl.DateTimeFormat(
                locale === "en" ? "en-US" : "id-ID",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }
              ).format(new Date(video.createdAt));

              if (effectiveViewMode === "list") {
                return (
                  <Link
                    key={video.id}
                    href={`/v/${video.publicSlug}`}
                    aria-label={`${locale === "en" ? "View video" : "Lihat video"} ${video.title}`}
                    className="group grid min-w-0 grid-cols-[112px_minmax(0,1fr)] items-stretch gap-3 rounded-xl border border-[#ddd3cd] bg-white px-3 py-3 shadow-sm transition hover:border-[#e7c6bc] hover:shadow-[0_12px_24px_rgba(29,23,20,0.08)] sm:grid-cols-[150px_minmax(0,1fr)]"
                  >
                    <div className="overflow-hidden rounded-lg border border-[#eee5df] bg-[#f4eeea]">
                      {thumbnail ? (
                        <Image
                          src={thumbnail}
                          alt={`Thumbnail ${video.title}`}
                          width={360}
                          height={220}
                          sizes="(max-width: 640px) 40vw, 150px"
                          className="aspect-video h-full w-full object-cover"
                          unoptimized
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex aspect-video h-full w-full items-center justify-center bg-[#f4eeea] text-xs font-medium text-[#7a6d65]">
                          <span className="inline-flex items-center gap-1">
                            <PlayCircle className="h-3.5 w-3.5 text-[#ef5f49]" />
                            Video
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-col gap-3">
                      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                        <span
                          className={cn("inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", sourceMeta.className)}
                        >
                          {sourceMeta.label}
                        </span>
                        <span className="text-[11px] text-[#7a6d65]">{postedAtLabel}</span>
                      </div>
                      <p className="line-clamp-2 min-w-0 text-sm font-semibold leading-6 text-[#201b18] sm:text-[15px]">
                        {video.title}
                      </p>
                      <div className="mt-0.5 flex min-w-0 items-center gap-2.5">
                        <AvatarBadge
                          name={video.author?.name || "Creator"}
                          avatarUrl={video.author?.image || ""}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-[#4a3d37]">
                            {video.author?.name || "Creator"}
                          </p>
                          <p className="truncate text-[11px] text-[#7a6d65]">
                            @{video.author?.username || "creator"}
                          </p>
                        </div>
                      </div>
                      <p className="line-clamp-2 text-xs leading-6 text-[#5f524b] sm:text-sm">
                        {video.description}
                      </p>
                    </div>
                  </Link>
                );
              }

              return (
                <Link
                  key={video.id}
                  href={`/v/${video.publicSlug}`}
                  aria-label={`${locale === "en" ? "View video" : "Lihat video"} ${video.title}`}
                  className={cn(
                    "group flex min-w-0 flex-col gap-3.5 rounded-[1.2rem] border border-[#ddd3cd] bg-white p-4 shadow-sm transition hover:border-[#e7c6bc] hover:shadow-[0_16px_30px_rgba(29,23,20,0.1)] sm:p-5",
                    effectiveViewMode === "grid"
                      ? "h-full min-h-[398px]"
                      : ""
                  )}
                >
                  <div className="overflow-hidden rounded-xl border border-[#eee5df] bg-[#f4eeea]">
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
                      <div className="flex aspect-video items-center justify-center bg-[#f4eeea] text-sm font-medium text-[#7a6d65]">
                        <span className="inline-flex items-center gap-1">
                          <PlayCircle className="h-4 w-4 text-[#ef5f49]" />
                          Video
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                      <p className="line-clamp-2 min-w-0 flex-1 pr-1 text-[1.02rem] font-semibold leading-6 text-[#201b18] sm:text-lg sm:leading-7">
                        {video.title}
                      </p>
                      <span
                        className={cn(
                          "mt-0.5 inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                          sourceMeta.className
                        )}
                      >
                        {sourceMeta.label}
                      </span>
                    </div>

                    <div className="mt-0.5 flex min-w-0 items-center gap-2.5">
                      <AvatarBadge
                        name={video.author?.name || "Creator"}
                        avatarUrl={video.author?.image || ""}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#4a3d37]">
                          {video.author?.name || "Creator"}
                        </p>
                        <p className="truncate text-xs text-[#7a6d65]">
                          @{video.author?.username || "creator"}
                        </p>
                      </div>
                    </div>

                    <p className="line-clamp-2 text-sm leading-6 text-[#5f524b]">
                      {video.description}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-[#e9dfda] pt-3 text-sm">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#1a1412] text-white shadow-sm transition group-hover:bg-[#2a211d]"
                      title={locale === "en" ? "View video" : "Lihat video"}
                    >
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <span className="text-[#7a6d65]">{postedAtLabel}</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
        <div className="mt-7 flex justify-center">
          <Link
            href="/"
            className="inline-flex h-11 min-w-[196px] items-center justify-center rounded-2xl border border-[#ddd3cd] bg-white px-5 text-sm font-semibold text-[#201b18] shadow-sm transition hover:bg-[#faf6f3]"
          >
            {locale === "en" ? "Back to Home" : "Kembali ke Home"}
          </Link>
        </div>
      </section>
    </main>
  );
}
