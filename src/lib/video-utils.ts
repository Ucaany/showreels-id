import type { VideoSource, VideoVisibility } from "@/lib/types";
import { extractGoogleDriveFileId } from "@/lib/avatar-utils";

const YOUTUBE_REGEX =
  /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{6,})/i;
const GDRIVE_REGEX =
  /(drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=|thumbnail\?(?:[^#]*&)?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/i;
const INSTAGRAM_REGEX =
  /instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/i;
const VIMEO_REGEX = /vimeo\.com\/(?:video\/)?([0-9]+)/i;

function extractYoutubeId(url: string): string | null {
  const match = url.match(YOUTUBE_REGEX);
  return match?.[1] || null;
}

function extractGdriveId(url: string): string | null {
  return extractGoogleDriveFileId(url);
}

function extractVimeoId(url: string): string | null {
  const match = url.match(VIMEO_REGEX);
  return match?.[1] || null;
}

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
      const id = extractYoutubeId(sourceUrl);
      return id ? `https://www.youtube.com/embed/${id}` : sourceUrl;
    }
    case "gdrive": {
      const id = extractGdriveId(sourceUrl);
      return id
        ? `https://drive.google.com/file/d/${id}/preview`
        : sourceUrl;
    }
    case "instagram": {
      const match = sourceUrl.match(INSTAGRAM_REGEX);
      return match
        ? `https://www.instagram.com/p/${match[1]}/embed`
        : sourceUrl;
    }
    case "vimeo": {
      const id = extractVimeoId(sourceUrl);
      return id ? `https://player.vimeo.com/video/${id}` : sourceUrl;
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

export function normalizeHttpUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

export function normalizeAssetUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("data:image/")) {
    return "";
  }

  return normalizeHttpUrl(trimmed);
}

export function parseMultilineUrls(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((item) => normalizeHttpUrl(item))
    .filter(Boolean);
}

export function getAutoThumbnailFromVideoUrl(sourceUrl: string): string {
  const source = detectVideoSource(sourceUrl);
  if (!source) {
    return "";
  }

  if (source === "youtube") {
    const id = extractYoutubeId(sourceUrl);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
  }

  if (source === "gdrive") {
    const id = extractGdriveId(sourceUrl);
    return id ? `https://lh3.googleusercontent.com/d/${id}=w640` : "";
  }

  if (source === "vimeo") {
    const id = extractVimeoId(sourceUrl);
    return id ? `https://vumbnail.com/${id}.jpg` : "";
  }

  if (source === "instagram") {
    const match = sourceUrl.match(INSTAGRAM_REGEX);
    return match ? `https://www.instagram.com/p/${match[1]}/media/?size=l` : "";
  }

  return "";
}

export function getThumbnailCandidates(
  sourceUrl: string,
  manualThumbnailUrl?: string | null
): string[] {
  const candidates: string[] = [];
  const addCandidate = (value?: string | null) => {
    const normalized = value?.trim() || "";
    if (!normalized || candidates.includes(normalized)) {
      return;
    }
    candidates.push(normalized);
  };

  addCandidate(manualThumbnailUrl);

  const source = detectVideoSource(sourceUrl);
  if (!source) {
    return candidates;
  }

  if (source === "youtube") {
    const id = extractYoutubeId(sourceUrl);
    if (id) {
      addCandidate(`https://img.youtube.com/vi/${id}/mqdefault.jpg`);
      addCandidate(`https://img.youtube.com/vi/${id}/hqdefault.jpg`);
      addCandidate(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`);
    }
    return candidates;
  }

  if (source === "gdrive") {
    const id = extractGdriveId(sourceUrl);
    if (id) {
      addCandidate(`https://lh3.googleusercontent.com/d/${id}=w640`);
      addCandidate(`https://drive.google.com/thumbnail?id=${id}&sz=w640`);
      addCandidate(`https://drive.google.com/uc?id=${id}`);
    }
    return candidates;
  }

  if (source === "vimeo") {
    const id = extractVimeoId(sourceUrl);
    if (id) {
      addCandidate(`https://vumbnail.com/${id}.jpg`);
    }
    return candidates;
  }

  if (source === "instagram") {
    const match = sourceUrl.match(INSTAGRAM_REGEX);
    if (match) {
      addCandidate(`https://www.instagram.com/p/${match[1]}/media/?size=l`);
    }
  }

  return candidates;
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
  const tagSummary = tags.length
    ? `Highlight utama: ${tags.join(", ")}.`
    : "Highlight visual dan konteks project masih bisa disesuaikan saat revisi akhir.";
  const sourceSummary =
    source === "youtube"
      ? "Video ini disiapkan untuk tampil rapi di kanal YouTube dan kebutuhan presentasi client."
      : source === "gdrive"
        ? "File utama disimpan melalui Google Drive agar mudah direview dan dibagikan ke client."
        : source === "instagram"
          ? "Format konten ini cocok untuk distribusi sosial media dengan durasi yang ringkas dan visual yang cepat ditangkap."
          : "Video ini disusun dengan format presentasi yang tetap nyaman saat dibuka lintas perangkat.";

  return `Project "${title}" menampilkan pendekatan editing yang fokus pada alur cerita yang jelas, ritme visual yang bersih, dan hasil akhir yang siap dipresentasikan. ${sourceSummary} ${tagSummary}`;
}

export function getSocialShareLinks(url: string, title: string): {
  x: string;
  facebook: string;
  whatsapp: string;
  threads: string;
  instagram: string;
} {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const shareText = `${encodedTitle}%20${encodedUrl}`;

  return {
    x: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${shareText}`,
    threads: `https://www.threads.net/intent/post?text=${shareText}`,
    instagram: `https://www.instagram.com/?url=${encodedUrl}`,
  };
}
