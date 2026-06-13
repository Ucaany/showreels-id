/**
 * Helpers for image CDN URLs (Cloudinary / ImageKit) + safe fallbacks for next/image.
 */

const DEFAULT_THUMB_PATH = "/default-thumbnail.jpg";

export function getCloudinaryCloudName(): string | null {
  const name = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  return name || null;
}

export function getImageKitBaseUrl(): string | null {
  const base = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT?.trim();
  return base?.replace(/\/$/, "") || null;
}

/**
 * Build an optimized Cloudinary delivery URL with automatic format & quality.
 * Pass `publicIdOrPath` without leading slash after upload folder, or full path segment after `/upload/`.
 */
export function cloudinaryOptimizedUrl(
  publicIdOrPath: string,
  options?: { width?: number; height?: number; crop?: "fill" | "limit" | "fit" }
): string | null {
  const cloud = getCloudinaryCloudName();
  if (!cloud || !publicIdOrPath?.trim()) return null;

  const path = publicIdOrPath.replace(/^\/+/, "");
  const w = options?.width ? `w_${options.width}` : "";
  const h = options?.height ? `h_${options.height}` : "";
  const c = options?.crop ? `c_${options.crop}` : "c_fill";
  const transforms = ["f_auto", "q_auto", c, w, h].filter(Boolean).join(",");

  return `https://res.cloudinary.com/${cloud}/image/upload/${transforms}/${path}`;
}

/** ImageKit path transformation (tr:w-W,h-H,f-auto,q-auto) */
export function imageKitOptimizedUrl(path: string, options?: { width?: number; height?: number }): string | null {
  const base = getImageKitBaseUrl();
  if (!base || !path?.trim()) return null;

  const cleanPath = path.replace(/^\/+/, "");
  const tr = [`f-auto`, `q-auto`];
  if (options?.width) tr.push(`w-${options.width}`);
  if (options?.height) tr.push(`h-${options.height}`);
  const trSegment = tr.join(",");

  return `${base}/tr:${trSegment}/${cleanPath}`;
}

function cloudinaryTransformSegment(options?: {
  width?: number;
  height?: number;
  crop?: "fill" | "limit" | "fit";
}): string {
  const w = options?.width ? `w_${options.width}` : "w_640";
  const h = options?.height ? `h_${options.height}` : "";
  const c = options?.crop ? `c_${options.crop}` : "c_fill";
  return ["f_auto", "q_auto", c, w, h].filter(Boolean).join(",");
}

function optimizeCloudinaryDeliveryUrl(
  src: string,
  options?: { width?: number; height?: number; crop?: "fill" | "limit" | "fit" }
): string {
  try {
    const url = new URL(src);
    if (url.hostname !== "res.cloudinary.com") {
      return src;
    }

    const uploadMarker = "/image/upload/";
    const uploadIndex = url.pathname.indexOf(uploadMarker);
    if (uploadIndex < 0) {
      return src;
    }

    const beforeUpload = url.pathname.slice(0, uploadIndex + uploadMarker.length);
    const afterUpload = url.pathname.slice(uploadIndex + uploadMarker.length);
    if (!afterUpload || afterUpload.includes("f_auto") || afterUpload.includes("q_auto")) {
      return src;
    }

    url.pathname = `${beforeUpload}${cloudinaryTransformSegment(options)}/${afterUpload}`;
    return url.toString();
  } catch {
    return src;
  }
}

/**
 * Safe thumbnail src for cards (fallback). Prefer storing optimized Cloudinary URLs at upload time;
 * use {@link cloudinaryOptimizedUrl} when building new URLs.
 */
export function optimizeThumbnailSrc(
  src: string | null | undefined,
  options?: { width?: number; height?: number; crop?: "fill" | "limit" | "fit" }
): string {
  if (!src?.trim()) return DEFAULT_THUMB_PATH;
  return optimizeCloudinaryDeliveryUrl(src.trim(), options);
}

export function defaultThumbnailSrc(): string {
  return DEFAULT_THUMB_PATH;
}
