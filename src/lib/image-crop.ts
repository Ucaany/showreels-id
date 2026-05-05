import type { CSSProperties } from "react";

export type ImageCropValues = {
  x?: number | null;
  y?: number | null;
  zoom?: number | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function normalizeImageCrop(values?: ImageCropValues | null) {
  return {
    x: clamp(Math.round(values?.x ?? 0), -100, 100),
    y: clamp(Math.round(values?.y ?? 0), -100, 100),
    zoom: clamp(Math.round(values?.zoom ?? 100), 100, 300),
  };
}

export function getBackgroundImageCropStyle(
  imageUrl: string,
  values?: ImageCropValues | null,
  overlay?: string
): CSSProperties {
  const crop = normalizeImageCrop(values);
  const quotedUrl = `'${imageUrl.replace(/'/g, "\\'")}'`;
  const backgroundLayers = overlay ? `${overlay}, url(${quotedUrl})` : `url(${quotedUrl})`;

  const sizeValue = crop.zoom <= 100 ? "cover" : `${crop.zoom}%`;

  return {
    backgroundImage: backgroundLayers,
    backgroundPosition: `calc(50% + ${crop.x}%) calc(50% + ${crop.y}%)`,
    backgroundRepeat: "no-repeat",
    backgroundSize: sizeValue,
  };
}
