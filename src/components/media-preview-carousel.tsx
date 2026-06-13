"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, Image as ImageIcon, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { optimizeThumbnailSrc } from "@/lib/cdn-image";
import {
  detectVideoSource,
  getAutoThumbnailFromVideoUrl,
  getEmbedUrl,
  isDirectVideoUrl,
} from "@/lib/video-utils";
import type { VideoAspectRatio, VideoSource } from "@/lib/types";

const LazyMediaLightbox = dynamic(
  () => import("@/components/media-lightbox").then((mod) => mod.MediaLightbox),
  { ssr: false, loading: () => null }
);

type MediaSlide =
  | { type: "cover"; url: string }
  | { type: "video"; url: string }
  | { type: "image"; url: string };

interface MediaPreviewCarouselProps {
  manualThumbnailUrl?: string;
  fallbackThumbnailUrl?: string;
  mainVideoUrl?: string;
  extraVideoUrls: string[];
  imageUrls: string[];
  title: string;
  showHeading?: boolean;
  showStatusBadge?: boolean;
  preferMainVideo?: boolean;
  aspectRatio?: VideoAspectRatio;
}

export function MediaPreviewCarousel({
  manualThumbnailUrl,
  fallbackThumbnailUrl,
  mainVideoUrl,
  extraVideoUrls,
  imageUrls,
  title,
  showHeading = true,
  showStatusBadge = true,
  preferMainVideo = false,
  aspectRatio = "landscape",
}: MediaPreviewCarouselProps) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  /** Lazy-mount iframe only after user taps play (per video URL). */
  const [embedReadyForUrl, setEmbedReadyForUrl] = useState<Record<string, boolean>>({});
  const optimizedManualThumbnailUrl = manualThumbnailUrl
    ? optimizeThumbnailSrc(manualThumbnailUrl, { width: 1280, height: 720 })
    : "";
  const optimizedFallbackThumbnailUrl = fallbackThumbnailUrl
    ? optimizeThumbnailSrc(fallbackThumbnailUrl, { width: 1280, height: 720 })
    : "";

  const slides = useMemo<MediaSlide[]>(() => {
    const coverSlides: MediaSlide[] = optimizedManualThumbnailUrl
      ? [{ type: "cover" as const, url: optimizedManualThumbnailUrl }]
      : [];
    const galleryEnabled = Boolean(optimizedManualThumbnailUrl);
    const videoSlides: MediaSlide[] = galleryEnabled
      ? [
      ...(mainVideoUrl ? [{ type: "video", url: mainVideoUrl } as const] : []),
      ...extraVideoUrls.map((url) => ({ type: "video" as const, url })),
    ]
      : [];
    const imageSlides: MediaSlide[] = galleryEnabled
      ? imageUrls.map((url) => ({
          type: "image" as const,
          url: optimizeThumbnailSrc(url, { width: 1280, height: 720, crop: "limit" }),
        }))
      : [];
    const singleFallback: MediaSlide[] = !galleryEnabled
      ? preferMainVideo && mainVideoUrl
        ? [{ type: "video" as const, url: mainVideoUrl }]
        : optimizedFallbackThumbnailUrl
          ? [{ type: "cover" as const, url: optimizedFallbackThumbnailUrl }]
          : mainVideoUrl
            ? [{ type: "video" as const, url: mainVideoUrl }]
            : []
      : [];
    if (!galleryEnabled) {
      return singleFallback;
    }

    return preferMainVideo
      ? [...videoSlides, ...coverSlides, ...imageSlides]
      : [...coverSlides, ...videoSlides, ...imageSlides];
  }, [
    optimizedManualThumbnailUrl,
    optimizedFallbackThumbnailUrl,
    mainVideoUrl,
    extraVideoUrls,
    imageUrls,
    preferMainVideo,
  ]);

  if (slides.length === 0) {
    return null;
  }

  const active = slides[index] ?? slides[0];
  const canSlide = slides.length > 1;
  const headingLabel = canSlide ? "Media Preview" : "Preview Utama";
  const frameClass =
    aspectRatio === "portrait"
      ? "mx-auto aspect-[9/16] h-auto max-h-[70vh] w-full min-w-0 max-w-[min(420px,100%)]"
      : "aspect-video w-full min-w-0 max-w-full";
  const mediaWrapperClass =
    aspectRatio === "portrait"
      ? "relative min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#F3F4F6] shadow-card"
      : "relative min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-card";

  const imageSlides = slides.filter((slide) => slide.type !== "video");
  const lightboxIndex = Math.max(
    0,
    imageSlides.findIndex((slide) => slide.url === active.url)
  );

  const renderVideo = (url: string) => {
    const source = detectVideoSource(url) as VideoSource | null;
    if (!source) {
      return (
        <div className="flex aspect-video min-w-0 max-w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-600">
          <p>URL video tidak didukung untuk preview di halaman ini.</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
          >
            Buka Source Asli
          </a>
        </div>
      );
    }

    const poster =
      (optimizedManualThumbnailUrl && url === mainVideoUrl ? optimizedManualThumbnailUrl : "") ||
      optimizedFallbackThumbnailUrl ||
      getAutoThumbnailFromVideoUrl(url) ||
      "";
    const embedReady = embedReadyForUrl[url] ?? false;
    const embedUrl = getEmbedUrl(url, source);
    const directVideo = source === "upload" || isDirectVideoUrl(url);
    const hasEmbedUrl = Boolean(embedUrl && embedUrl !== url);
    const canInlineEmbed = directVideo || hasEmbedUrl;

    if (!canInlineEmbed) {
      return (
        <div className="flex aspect-video min-w-0 max-w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-600">
          <p>Video ini tidak bisa di-embed langsung dan membutuhkan link final provider.</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
          >
            Buka Source Asli
          </a>
        </div>
      );
    }

    return (
      <div className={mediaWrapperClass}>
        <div className={`relative ${frameClass}`}>
          {directVideo ? (
            <video
              src={url}
              poster={poster || undefined}
              className="h-full w-full rounded-2xl object-cover"
              controls
              preload="metadata"
            />
          ) : embedReady ? (
            <iframe
              title={title}
              src={embedUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <>
              {poster ? (
                <Image
                  src={poster}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 820px"
                  className="rounded-2xl object-cover"
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMzInIGhlaWdodD0nMTgnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc+PHJlY3Qgd2lkdGg9JzMyJyBoZWlnaHQ9JzE4JyBmaWxsPScjZWVlZWVlJy8+PC9zdmc+"
                />
              ) : (
                <div className="flex h-full min-h-[200px] w-full items-center justify-center rounded-2xl bg-slate-900">
                  <PlayCircle className="h-14 w-14 text-slate-500" />
                </div>
              )}
              <button
                type="button"
                className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 transition hover:bg-black/50"
                aria-label="Putar video"
                onClick={() =>
                  setEmbedReadyForUrl((prev) => ({
                    ...prev,
                    [url]: true,
                  }))
                }
              >
                <span className="rounded-full bg-white/95 p-4 shadow-lg ring-1 ring-black/10">
                  <PlayCircle className="h-12 w-12 text-slate-900" aria-hidden />
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-w-0 max-w-full space-y-3.5 overflow-hidden">
      {showHeading ? (
        <div className="flex min-w-0 max-w-full items-center justify-between gap-3">
          <h2 className="min-w-0 break-words text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs sm:tracking-[0.2em]">
            {headingLabel}
          </h2>
          {canSlide ? (
            <p className="inline-flex shrink-0 items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
              {index + 1}/{slides.length}
            </p>
          ) : null}
        </div>
      ) : null}

      {active.type === "video" ? (
        renderVideo(active.url)
      ) : (
        <div className="relative min-w-0 max-w-full overflow-hidden">
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="group block w-full min-w-0 max-w-full overflow-hidden"
            aria-label="Buka preview fullscreen"
          >
            <Image
              src={active.url}
              alt={`Preview media ${index + 1}`}
              width={1280}
              height={720}
              sizes="(max-width: 1024px) 100vw, 820px"
              className={`max-w-full rounded-2xl border border-slate-200 bg-[#F3F4F6] object-cover shadow-card ${frameClass}`}
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMzInIGhlaWdodD0nMTgnIHhtbG5zPSdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc+PHJlY3Qgd2lkdGg9JzMyJyBoZWlnaHQ9JzE4JyBmaWxsPScjZWVlZWVlJy8+PC9zdmc+"
            />
            <span className="pointer-events-none absolute bottom-3 right-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-white opacity-90 transition group-hover:opacity-100">
              <Expand className="h-3.5 w-3.5 shrink-0" />
              Fullscreen
            </span>
          </button>
          {active.type === "cover" && showStatusBadge ? (
            <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] rounded-full bg-slate-900/85 px-2.5 py-1 text-xs font-semibold text-white">
              Cover Video
            </span>
          ) : null}
        </div>
      )}

      {canSlide ? (
        <div className="flex min-w-0 max-w-full items-center justify-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-11 min-h-11 w-11 min-w-11 rounded-full border-slate-300 p-0 text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.08)] hover:border-slate-400 hover:bg-white"
            onClick={() => setIndex((prev) => (prev - 1 + slides.length) % slides.length)}
            aria-label="Media sebelumnya"
          >
            <ChevronLeft className="h-5 w-5 shrink-0" />
          </Button>
          {!showHeading ? (
            <p className="inline-flex min-w-[4.5rem] items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
              {index + 1}/{slides.length}
            </p>
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-11 min-h-11 w-11 min-w-11 rounded-full border-slate-300 p-0 text-slate-700 shadow-[0_6px_18px_rgba(15,23,42,0.08)] hover:border-slate-400 hover:bg-white"
            onClick={() => setIndex((prev) => (prev + 1) % slides.length)}
            aria-label="Media berikutnya"
          >
            <ChevronRight className="h-5 w-5 shrink-0" />
          </Button>
        </div>
      ) : null}

      {canSlide ? (
        <div className="flex min-w-0 max-w-full flex-wrap justify-center gap-1.5 pt-0.5">
          {slides.map((slide, slideIndex) => (
            <button
              key={`${slide.type}-${slide.url}-${slideIndex}`}
              type="button"
              onClick={() => setIndex(slideIndex)}
              className={`inline-flex max-w-full min-w-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                index === slideIndex
                  ? "border-slate-800 bg-slate-800 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
              aria-label={`Pilih media ${slideIndex + 1}`}
            >
              {slide.type === "video" ? (
                <PlayCircle className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5 shrink-0" />
              )}
              {slide.type === "cover"
                ? "Cover"
                : slide.type === "video"
                  ? `Video ${slideIndex + 1}`
                  : `Gambar ${slideIndex + 1}`}
            </button>
          ))}
        </div>
      ) : null}
      {lightboxOpen ? (
        <LazyMediaLightbox
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={imageSlides.map((slide) => ({ src: slide.url }))}
        />
      ) : null}
    </div>
  );
}
