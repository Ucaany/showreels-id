import type {
  MediaType,
  PreviewType,
  VideoSource,
  VideoVisibility,
} from "@/lib/types";
import { extractGoogleDriveFileId } from "@/lib/avatar-utils";

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{6,15}$/;
const INSTAGRAM_ID_REGEX = /^[a-zA-Z0-9._-]{5,}$/;
const NUMERIC_ID_REGEX = /^[0-9]{5,}$/;
const DIRECT_VIDEO_EXTENSION_REGEX = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i;
const DIRECT_IMAGE_EXTENSION_REGEX = /\.(jpg|jpeg|png|webp|gif|avif)(\?.*)?$/i;

export const DEFAULT_THUMBNAIL_URL = "/default-thumbnail.jpg";

type EmbedReadyVideoUrl = {
  source: VideoSource;
  id: string;
  canonicalUrl: string;
  embedUrl: string;
};

function toUrl(input: string): URL | null {
  const normalized = normalizeHttpUrl(input);
  if (!normalized) {
    return null;
  }

  try {
    return new URL(normalized);
  } catch {
    return null;
  }
}

function normalizeHost(host: string): string {
  return host.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
}

function extractYoutubeId(url: string): string | null {
  const parsed = toUrl(url);
  if (!parsed) {
    return null;
  }

  const host = normalizeHost(parsed.hostname);
  if (host === "youtu.be") {
    const id = parsed.pathname.split("/").filter(Boolean)[0] || "";
    return YOUTUBE_ID_REGEX.test(id) ? id : null;
  }

  if (host !== "youtube.com") {
    return null;
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments[0] === "watch") {
    const id = parsed.searchParams.get("v") || "";
    return YOUTUBE_ID_REGEX.test(id) ? id : null;
  }

  if (segments[0] === "shorts" || segments[0] === "embed") {
    const id = segments[1] || "";
    return YOUTUBE_ID_REGEX.test(id) ? id : null;
  }

  const fromQuery = parsed.searchParams.get("v") || "";
  return YOUTUBE_ID_REGEX.test(fromQuery) ? fromQuery : null;
}

function extractGdriveId(url: string): string | null {
  return extractGoogleDriveFileId(url);
}

function extractInstagramId(url: string): { id: string; type: "p" | "reel" | "tv" } | null {
  const parsed = toUrl(url);
  if (!parsed) {
    return null;
  }

  const host = normalizeHost(parsed.hostname);
  if (host !== "instagram.com") {
    return null;
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  const type = segments[0];
  const id = segments[1] || "";
  if ((type === "p" || type === "reel" || type === "tv") && INSTAGRAM_ID_REGEX.test(id)) {
    return { id, type };
  }

  return null;
}

function extractVimeoId(url: string): string | null {
  const parsed = toUrl(url);
  if (!parsed) {
    return null;
  }

  const host = normalizeHost(parsed.hostname);
  if (host !== "vimeo.com" && host !== "player.vimeo.com") {
    return null;
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const candidate = segments[index];
    if (NUMERIC_ID_REGEX.test(candidate)) {
      return candidate;
    }
  }

  return null;
}

function extractFacebookId(url: string): string | null {
  const parsed = toUrl(url);
  if (!parsed) {
    return null;
  }

  const host = normalizeHost(parsed.hostname);
  const segments = parsed.pathname.split("/").filter(Boolean);

  if (host === "fb.watch") {
    const id = segments[0] || "";
    return id ? id.replace(/[^a-zA-Z0-9_-]/g, "") : null;
  }

  if (host !== "facebook.com") {
    return null;
  }

  const fromWatch = parsed.searchParams.get("v") || "";
  if (fromWatch && /^[a-zA-Z0-9_-]{6,}$/.test(fromWatch)) {
    return fromWatch;
  }

  if (segments[0] === "reel" && segments[1] && NUMERIC_ID_REGEX.test(segments[1])) {
    return segments[1];
  }

  if (segments[0] === "video.php") {
    const videoId = parsed.searchParams.get("v") || "";
    return videoId && /^[a-zA-Z0-9_-]{6,}$/.test(videoId) ? videoId : null;
  }

  const videosIndex = segments.findIndex((segment) => segment === "videos");
  if (videosIndex >= 0 && segments[videosIndex + 1]) {
    const id = segments[videosIndex + 1];
    return /^[a-zA-Z0-9_-]{6,}$/.test(id) ? id : null;
  }

  return null;
}

function extractTiktokId(url: string): string | null {
  const parsed = toUrl(url);
  if (!parsed) {
    return null;
  }

  const host = normalizeHost(parsed.hostname);

  // Handle vm.tiktok.com short links — we can't resolve them server-side,
  // but we store the full path segment as the id for embed purposes.
  if (host === "vm.tiktok.com") {
    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments[0] || null;
  }

  if (host !== "tiktok.com") {
    return null;
  }

  const segments = parsed.pathname.split("/").filter(Boolean);

  // Format: /@username/video/1234567890123456789
  const videoIndex = segments.findIndex((s) => s === "video");
  if (videoIndex >= 0 && segments[videoIndex + 1]) {
    const id = segments[videoIndex + 1];
    return /^[0-9]{10,}$/.test(id) ? id : null;
  }

  return null;
}

export function isDirectVideoUrl(url: string): boolean {
  const normalized = normalizeHttpUrl(url);
  return Boolean(normalized && DIRECT_VIDEO_EXTENSION_REGEX.test(normalized));
}

export function isDirectImageUrl(url: string): boolean {
  const normalized = normalizeHttpUrl(url);
  return Boolean(normalized && DIRECT_IMAGE_EXTENSION_REGEX.test(normalized));
}

export function isDirectUploadUrl(url: string): boolean {
  return isDirectVideoUrl(url) || isDirectImageUrl(url);
}

export function getEmbedReadyVideoUrl(url: string): EmbedReadyVideoUrl | null {
  const normalized = normalizeHttpUrl(url);
  if (!normalized) {
    return null;
  }

  const youtubeId = extractYoutubeId(normalized);
  if (youtubeId) {
    return {
      source: "youtube",
      id: youtubeId,
      canonicalUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
      embedUrl: `https://www.youtube.com/embed/${youtubeId}`,
    };
  }

  const gdriveId = extractGdriveId(normalized);
  if (gdriveId) {
    return {
      source: "gdrive",
      id: gdriveId,
      canonicalUrl: `https://drive.google.com/file/d/${gdriveId}/view`,
      embedUrl: `https://drive.google.com/file/d/${gdriveId}/preview`,
    };
  }

  const instagram = extractInstagramId(normalized);
  if (instagram) {
    return {
      source: "instagram",
      id: instagram.id,
      canonicalUrl: `https://www.instagram.com/${instagram.type}/${instagram.id}/`,
      embedUrl: `https://www.instagram.com/${instagram.type}/${instagram.id}/embed`,
    };
  }

  const vimeoId = extractVimeoId(normalized);
  if (vimeoId) {
    return {
      source: "vimeo",
      id: vimeoId,
      canonicalUrl: `https://vimeo.com/${vimeoId}`,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
    };
  }

  const facebookId = extractFacebookId(normalized);
  if (facebookId) {
    const canonicalUrl = `https://www.facebook.com/watch/?v=${facebookId}`;
    return {
      source: "facebook",
      id: facebookId,
      canonicalUrl,
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
        canonicalUrl
      )}&show_text=0`,
    };
  }

  const tiktokId = extractTiktokId(normalized);
  if (tiktokId) {
    return {
      source: "tiktok",
      id: tiktokId,
      canonicalUrl: `https://www.tiktok.com/video/${tiktokId}`,
      embedUrl: `https://www.tiktok.com/embed/v2/${tiktokId}`,
    };
  }

  if (isDirectUploadUrl(normalized)) {
    return {
      source: "upload",
      id: normalized,
      canonicalUrl: normalized,
      embedUrl: normalized,
    };
  }

  return null;
}

export function validateEmbedReadyVideoUrl(url: string): {
  ok: boolean;
  source?: VideoSource;
  canonicalUrl?: string;
  embedUrl?: string;
  error?: string;
} {
  const parsed = getEmbedReadyVideoUrl(url);
  if (!parsed) {
    return {
      ok: false,
      error:
        "URL video belum embed-ready. Gunakan link YouTube, Google Drive, Instagram, Facebook, Vimeo, TikTok, atau file media langsung.",
    };
  }

  return {
    ok: true,
    source: parsed.source,
    canonicalUrl: parsed.canonicalUrl,
    embedUrl: parsed.embedUrl,
  };
}

export function detectVideoSource(url: string): VideoSource | null {
  return getEmbedReadyVideoUrl(url)?.source || null;
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
  const base = slugifyText(title) || "showreels-portofolio";
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
  if (source === "upload") {
    return normalizeHttpUrl(sourceUrl) || sourceUrl;
  }

  const parsed = getEmbedReadyVideoUrl(sourceUrl);
  if (parsed && parsed.source === source) {
    return parsed.embedUrl;
  }

  return sourceUrl;
}

export function getSourceLabel(source: VideoSource): string {
  if (source === "youtube") return "YouTube";
  if (source === "gdrive") return "Google Drive";
  if (source === "instagram") return "Instagram";
  if (source === "facebook") return "Facebook";
  if (source === "tiktok") return "TikTok";
  if (source === "upload") return "Upload";
  return "Vimeo";
}

export function getVisibilityLabel(visibility: VideoVisibility): string {
  if (visibility === "draft") return "Draft";
  if (visibility === "private") return "Private";
  if (visibility === "semi_private") return "Semi Private";
  return "Public";
}

export function detectPreviewType(source: VideoSource | null): PreviewType {
  if (!source) return "upload";
  if (source === "youtube") return "youtube";
  if (source === "tiktok") return "tiktok";
  if (source === "vimeo") return "vimeo";
  if (source === "instagram") return "instagram";
  if (source === "facebook") return "facebook";
  if (source === "gdrive") return "gdrive";
  if (source === "upload") return "upload";
  return "upload";
}

export function detectMediaType(input: {
  sourceUrl?: string | null;
  imageUrls?: string[] | null;
}): MediaType {
  const sourceUrl = (input.sourceUrl || "").trim();
  if (sourceUrl && isDirectImageUrl(sourceUrl)) {
    return "image";
  }
  if (sourceUrl) {
    return "video";
  }
  const imageUrls = input.imageUrls || [];
  return imageUrls.length > 0 ? "image" : "video";
}

export async function fetchTiktokThumbnail(sourceUrl: string): Promise<string> {
  const parsed = getEmbedReadyVideoUrl(sourceUrl);
  if (!parsed || parsed.source !== "tiktok") {
    return "";
  }

  const candidates: string[] = [];

  try {
    const tikwmUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(parsed.canonicalUrl)}`;
    const response = await fetch(tikwmUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (response.ok) {
      const payload = (await response.json()) as {
        data?: { cover?: string; origin_cover?: string; ai_dynamic_cover?: string };
      };
      candidates.push(
        payload?.data?.origin_cover || "",
        payload?.data?.cover || "",
        payload?.data?.ai_dynamic_cover || ""
      );
    }
  } catch {
    // fallback ke oEmbed
  }

  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(parsed.canonicalUrl)}`;
    const response = await fetch(oembedUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (response.ok) {
      const payload = (await response.json()) as { thumbnail_url?: string };
      candidates.push(payload.thumbnail_url || "");
    }
  } catch {
    // handled by empty fallback
  }

  for (const candidate of candidates) {
    const normalized = normalizeAssetUrl(candidate || "");
    if (normalized) {
      return normalized;
    }
  }

  return "";
}

export function resolveThumbnailUrl(input: {
  customThumbnailUrl?: string | null;
  autoThumbnailUrl?: string | null;
  platformThumbnailUrl?: string | null;
  fallbackDefault?: string;
}): string {
  const custom = normalizeAssetUrl(input.customThumbnailUrl || "");
  if (custom) return custom;

  const auto = normalizeAssetUrl(input.autoThumbnailUrl || "");
  if (auto) return auto;

  const platform = normalizeAssetUrl(input.platformThumbnailUrl || "");
  if (platform) return platform;

  return input.fallbackDefault || DEFAULT_THUMBNAIL_URL;
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
    const parsed = getEmbedReadyVideoUrl(sourceUrl);
    if (parsed?.source === "instagram") {
      return `https://www.instagram.com/p/${parsed.id}/media/?size=l`;
    }
    return "";
  }

  if (source === "upload" && isDirectImageUrl(sourceUrl)) {
    return normalizeHttpUrl(sourceUrl);
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
    const parsed = getEmbedReadyVideoUrl(sourceUrl);
    if (parsed?.source === "instagram") {
      addCandidate(`https://www.instagram.com/p/${parsed.id}/media/?size=l`);
    }
    return candidates;
  }

  if (source === "upload" && isDirectImageUrl(sourceUrl)) {
    addCandidate(normalizeHttpUrl(sourceUrl));
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
      : source === "facebook"
        ? "Konten ini disiapkan agar tetap nyaman diputar langsung dari Facebook saat dibuka client."
      : source === "tiktok"
        ? "Konten ini dioptimalkan untuk format vertikal TikTok dengan ritme cepat dan visual yang engaging."
      : source === "upload"
        ? "File portfolio ini diunggah langsung agar mudah ditampilkan sebagai karya utama di halaman publik."
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
