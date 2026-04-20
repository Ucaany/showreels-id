import type { VideoSource, VideoVisibility } from "@/lib/types";

const YOUTUBE_REGEX =
  /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{6,})/i;
const GDRIVE_REGEX = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i;
const INSTAGRAM_REGEX =
  /instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/i;
const VIMEO_REGEX = /vimeo\.com\/(?:video\/)?([0-9]+)/i;

export function detectVideoSource(url: string): VideoSource | null {
  const normalized = url.trim();
  if (!normalized) {
    return null;
  }

  if (YOUTUBE_REGEX.test(normalized)) {
    return "youtube";
  }
  if (GDRIVE_REGEX.test(normalized)) {
    return "gdrive";
  }
  if (INSTAGRAM_REGEX.test(normalized)) {
    return "instagram";
  }
  if (VIMEO_REGEX.test(normalized)) {
    return "vimeo";
  }

  return null;
}

export function isSupportedVideoUrl(url: string): boolean {
  return detectVideoSource(url) !== null;
}

export function slugifyText(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createPublicSlug(
  title: string,
  existingSlugs: string[] = []
): string {
  const base = slugifyText(title) || "video-portofolio";
  if (!existingSlugs.includes(base)) {
    return base;
  }

  let suffix = 2;
  while (existingSlugs.includes(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}

export function getEmbedUrl(sourceUrl: string, source: VideoSource): string {
  switch (source) {
    case "youtube": {
      const match = sourceUrl.match(YOUTUBE_REGEX);
      return match ? `https://www.youtube.com/embed/${match[1]}` : sourceUrl;
    }
    case "gdrive": {
      const match = sourceUrl.match(GDRIVE_REGEX);
      return match
        ? `https://drive.google.com/file/d/${match[1]}/preview`
        : sourceUrl;
    }
    case "instagram": {
      const match = sourceUrl.match(INSTAGRAM_REGEX);
      return match
        ? `https://www.instagram.com/p/${match[1]}/embed`
        : sourceUrl;
    }
    case "vimeo": {
      const match = sourceUrl.match(VIMEO_REGEX);
      return match ? `https://player.vimeo.com/video/${match[1]}` : sourceUrl;
    }
    default:
      return sourceUrl;
  }
}

export function getSourceLabel(source: VideoSource): string {
  if (source === "youtube") return "YouTube";
  if (source === "gdrive") return "Google Drive";
  if (source === "instagram") return "Instagram";
  return "Vimeo";
}

export function getVisibilityLabel(visibility: VideoVisibility): string {
  if (visibility === "draft") return "Draft";
  if (visibility === "private") return "Private";
  return "Public";
}

export function buildAiDescription({
  title,
  tags,
  source,
}: {
  title: string;
  tags: string[];
  source: VideoSource;
}): string {
  const tagsLine = tags.length
    ? `Tag utama: ${tags.join(", ")}.`
    : "Tag utama akan diperbarui sesuai kebutuhan campaign.";

  return `Video "${title}" menampilkan hasil karya dengan sumber ${getSourceLabel(
    source
  )}. Fokus utama ada pada penyampaian cerita yang ringkas, ritme visual yang konsisten, dan kualitas output siap publish. ${tagsLine}`;
}

export function getSocialShareLinks(url: string, title: string): {
  x: string;
  facebook: string;
  whatsapp: string;
} {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return {
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
  };
}
