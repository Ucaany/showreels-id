const GOOGLE_DRIVE_FILE_REGEX = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i;
const GOOGLE_DRIVE_OPEN_REGEX = /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/i;
const GOOGLE_DRIVE_UC_REGEX = /[?&]id=([a-zA-Z0-9_-]+)/i;

export function extractGoogleDriveFileId(url: string): string | null {
  const normalized = url.trim();
  if (!normalized) {
    return null;
  }

  const fileMatch = normalized.match(GOOGLE_DRIVE_FILE_REGEX);
  if (fileMatch?.[1]) {
    return fileMatch[1];
  }

  const openMatch = normalized.match(GOOGLE_DRIVE_OPEN_REGEX);
  if (openMatch?.[1]) {
    return openMatch[1];
  }

  const ucMatch = normalized.match(GOOGLE_DRIVE_UC_REGEX);
  if (ucMatch?.[1] && normalized.includes("drive.google.com")) {
    return ucMatch[1];
  }

  return null;
}

export function normalizeAvatarUrl(input: string): string {
  const normalized = input.trim();
  if (!normalized) {
    return "";
  }

  if (normalized.startsWith("data:image/")) {
    return "";
  }

  const googleDriveId = extractGoogleDriveFileId(normalized);
  if (googleDriveId) {
    return `https://drive.google.com/thumbnail?id=${googleDriveId}&sz=w1000`;
  }

  const withProtocol =
    normalized.startsWith("http://") || normalized.startsWith("https://")
      ? normalized
      : `https://${normalized}`;

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
