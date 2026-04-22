import { detectVideoSource } from "@/lib/video-utils";

export type SourceBadgeMeta = {
  label: string;
  className: string;
};

export function getVideoSourceBadgeMeta(sourceUrl: string): SourceBadgeMeta {
  const source = detectVideoSource(sourceUrl);
  const normalized = sourceUrl.toLowerCase();

  if (source === "youtube") {
    return {
      label: "YouTube",
      className: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
    };
  }
  if (source === "gdrive") {
    return {
      label: "Google Drive",
      className: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    };
  }
  if (source === "instagram") {
    return {
      label: "Instagram",
      className: "bg-fuchsia-100 text-fuchsia-700 ring-1 ring-fuchsia-200",
    };
  }
  if (source === "vimeo") {
    return {
      label: "Vimeo",
      className: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
    };
  }
  if (normalized.includes("facebook.com") || normalized.includes("fb.watch")) {
    return {
      label: "Facebook",
      className: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
    };
  }

  return {
    label: "Video",
    className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  };
}
