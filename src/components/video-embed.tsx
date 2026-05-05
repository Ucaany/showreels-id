import Link from "next/link";
import { getEmbedUrl } from "@/lib/video-utils";
import type { VideoSource } from "@/lib/types";

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

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-card">
        <div className="aspect-video w-full">
          <iframe
            title={title}
            src={embedUrl}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
      <p className="text-sm text-slate-600">
        Jika embed tidak tampil, buka sumber asli di{" "}
        <Link href={sourceUrl} className="text-brand-600 hover:text-brand-700">
          tautan video ini
        </Link>
        .
      </p>
    </div>
  );
}
