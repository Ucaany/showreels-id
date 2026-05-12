"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { getEmbedUrl, isDirectVideoUrl } from "@/lib/video-utils";
import type { VideoSource } from "@/lib/types";

/**
 * Lazy-loaded video embed component.
 * Uses IntersectionObserver to defer iframe loading until the element
 * is within 200px of the viewport, reducing initial page weight.
 */
export function VideoEmbed({
  sourceUrl,
  source,
  title,
}: {
  sourceUrl: string;
  source: VideoSource;
  title: string;
}) {
  const embedUrl = getEmbedUrl(sourceUrl, source);
  const directVideo = source === "upload" || isDirectVideoUrl(sourceUrl);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-w-0 space-y-3">
      <div
        ref={containerRef}
        className="video-wrapper border border-slate-200 bg-slate-900 shadow-card"
      >
        <div className="h-full w-full">
          {directVideo ? (
            <video
              src={sourceUrl}
              className="h-full w-full bg-slate-900 object-contain"
              controls
              preload="metadata"
            />
          ) : isVisible ? (
            <iframe
              title={title}
              src={embedUrl}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-900">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Play className="h-10 w-10" />
                <span className="text-xs">Memuat video...</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="text-safe text-sm text-slate-600">
        Jika embed tidak tampil, buka sumber asli di{" "}
        <Link href={sourceUrl} className="text-brand-600 hover:text-brand-700">
          tautan video ini
        </Link>
        .
      </p>
    </div>
  );
}
