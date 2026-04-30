"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { detectVideoSource, getEmbedUrl } from "@/lib/video-utils";
import type { VideoAspectRatio, VideoSource } from "@/lib/types";

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

  const slides = useMemo<MediaSlide[]>(() => {
    const coverSlides: MediaSlide[] = manualThumbnailUrl
      ? [{ type: "cover" as const, url: manualThumbnailUrl }]
      : [];
    const galleryEnabled = Boolean(manualThumbnailUrl);
    const videoSlides: MediaSlide[] = galleryEnabled
      ? [
      ...(mainVideoUrl ? [{ type: "video", url: mainVideoUrl } as const] : []),
      ...extraVideoUrls.map((url) => ({ type: "video" as const, url })),
    ]
      : [];
    const imageSlides: MediaSlide[] = galleryEnabled
      ? imageUrls.map((url) => ({
          type: "image" as const,
          url,
        }))
      : [];
    const singleFallback: MediaSlide[] = !galleryEnabled
      ? preferMainVideo && mainVideoUrl
        ? [{ type: "video" as const, url: mainVideoUrl }]
        : fallbackThumbnailUrl
          ? [{ type: "cover" as const, url: fallbackThumbnailUrl }]
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
    manualThumbnailUrl,
    fallbackThumbnailUrl,
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
  const shouldCenterSlideControls = Boolean(manualThumbnailUrl) && canSlide;
  const headingLabel = canSlide ? "Preview Media" : "Preview Utama";
  const frameClass =
    aspectRatio === "portrait"
      ? "mx-auto aspect-[9/16] h-auto max-h-[70vh] w-full max-w-[360px] object-contain"
      : "aspect-video w-full";
  const mediaWrapperClass =
    aspectRatio === "portrait"
      ? "relative overflow-hidden rounded-2xl border border-slate-200 bg-[#F3F4F6] shadow-card"
      : "relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-card";

  const renderVideo = (url: string) => {
    const source = detectVideoSource(url) as VideoSource | null;
    if (!source) {
      return (
        <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          URL video tidak didukung untuk preview.
        </div>
      );
    }

    return (
      <div className={mediaWrapperClass}>
        <div className={frameClass}>
          <iframe
            title={title}
            src={getEmbedUrl(url, source)}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {showHeading ? (
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
            {headingLabel}
          </h2>
          {canSlide ? (
            <p className="text-xs text-slate-600">
              {index + 1}/{slides.length}
            </p>
          ) : null}
        </div>
      ) : canSlide ? (
        <div className="flex justify-end">
          <p className="text-xs text-slate-600">
            {index + 1}/{slides.length}
          </p>
        </div>
      ) : null}

      {active.type === "video" ? (
        renderVideo(active.url)
      ) : (
        <div className="relative">
          <Image
            src={active.url}
            alt={`Preview media ${index + 1}`}
            width={1280}
            height={720}
            sizes="(max-width: 1024px) 100vw, 820px"
            unoptimized
            className={`rounded-2xl border border-slate-200 bg-[#F3F4F6] shadow-card ${aspectRatio === "portrait" ? "object-contain" : "object-cover"} ${frameClass}`}
            loading="lazy"
          />
          {active.type === "cover" && showStatusBadge ? (
            <span className="absolute left-3 top-3 rounded-full bg-slate-900/85 px-2.5 py-1 text-xs font-semibold text-white">
              Cover Video
            </span>
          ) : null}
        </div>
      )}

      {canSlide ? (
        <div
          className={`flex items-center gap-3 ${
            shouldCenterSlideControls ? "justify-center" : "justify-between"
          }`}
        >
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIndex((prev) => (prev - 1 + slides.length) % slides.length)}
          >
            <ChevronLeft className="h-4 w-4" />
            Sebelumnya
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIndex((prev) => (prev + 1) % slides.length)}
          >
            Berikutnya
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}

      {canSlide ? (
        <div className="flex flex-wrap gap-2">
          {slides.map((slide, slideIndex) => (
            <button
              key={`${slide.type}-${slide.url}-${slideIndex}`}
              type="button"
              onClick={() => setIndex(slideIndex)}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                index === slideIndex
                  ? "border-brand-400 bg-brand-50 text-brand-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-brand-200"
              }`}
            >
              {slide.type === "video" ? (
                <PlayCircle className="h-3.5 w-3.5" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5" />
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
    </div>
  );
}
