"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeImageCrop, type ImageCropValues } from "@/lib/image-crop";

type ImageCropDialogProps = {
  aspectRatio: number;
  imageSrc: string;
  initialCrop?: ImageCropValues | null;
  onCancel: () => void;
  onConfirm: (crop: { x: number; y: number; zoom: number }) => void;
  open: boolean;
  shape?: "rect" | "circle";
  title: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function ImageCropDialog({
  aspectRatio,
  imageSrc,
  initialCrop,
  onCancel,
  onConfirm,
  open,
  shape = "rect",
  title,
}: ImageCropDialogProps) {
  const normalizedInitialCrop = normalizeImageCrop(initialCrop);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(normalizedInitialCrop.zoom);
  const [offsetX, setOffsetX] = useState(normalizedInitialCrop.x);
  const [offsetY, setOffsetY] = useState(normalizedInitialCrop.y);
  const [frameWidth, setFrameWidth] = useState(320);
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    if (!open || !frameRef.current) {
      return;
    }

    const updateFrameWidth = () => {
      if (!frameRef.current) {
        return;
      }
      setFrameWidth(Math.max(220, Math.round(frameRef.current.clientWidth)));
    };

    updateFrameWidth();
    const observer = new ResizeObserver(updateFrameWidth);
    observer.observe(frameRef.current);

    return () => observer.disconnect();
  }, [open]);

  const frameHeight = useMemo(() => {
    if (shape === "circle") {
      return frameWidth;
    }

    return Math.max(180, Math.round(frameWidth / aspectRatio));
  }, [aspectRatio, frameWidth, shape]);

  const renderedSize = useMemo(() => {
    const baseScale = Math.max(
      frameWidth / naturalSize.width,
      frameHeight / naturalSize.height
    );
    const scaleMultiplier = zoom / 100;

    return {
      width: naturalSize.width * baseScale * scaleMultiplier,
      height: naturalSize.height * baseScale * scaleMultiplier,
    };
  }, [frameHeight, frameWidth, naturalSize.height, naturalSize.width, zoom]);

  const pixelOffsetBounds = useMemo(
    () => ({
      x: Math.max(0, (renderedSize.width - frameWidth) / 2),
      y: Math.max(0, (renderedSize.height - frameHeight) / 2),
    }),
    [frameHeight, frameWidth, renderedSize.height, renderedSize.width]
  );

  if (!open) {
    return null;
  }

  const desiredOffsetX = (offsetX / 100) * frameWidth;
  const desiredOffsetY = (offsetY / 100) * frameHeight;
  const clampedOffsetX = clamp(
    desiredOffsetX,
    -pixelOffsetBounds.x,
    pixelOffsetBounds.x
  );
  const clampedOffsetY = clamp(
    desiredOffsetY,
    -pixelOffsetBounds.y,
    pixelOffsetBounds.y
  );
  const left = (frameWidth - renderedSize.width) / 2 + clampedOffsetX;
  const top = (frameHeight - renderedSize.height) / 2 + clampedOffsetY;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 sm:p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-4 shadow-2xl sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
              Crop image
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950 sm:text-xl">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Sesuaikan framing agar avatar atau cover tetap rapi di desktop dan handphone.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"
            onClick={onCancel}
            aria-label="Tutup crop dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.16),_transparent_42%),linear-gradient(180deg,_rgba(248,250,252,0.95),_rgba(226,232,240,0.85))] p-3 sm:p-4">
          <div
            ref={frameRef}
            className={`relative mx-auto w-full max-w-[520px] overflow-hidden border border-white/80 bg-slate-950/8 shadow-inner ${
              shape === "circle" ? "rounded-full" : "rounded-[24px]"
            }`}
            style={{ height: frameHeight }}
          >
            <img
              src={imageSrc}
              alt="Preview crop"
              className="pointer-events-none absolute max-w-none select-none"
              style={{
                width: `${renderedSize.width}px`,
                height: `${renderedSize.height}px`,
                left: `${left}px`,
                top: `${top}px`,
              }}
              onLoad={(event) =>
                setNaturalSize({
                  width: event.currentTarget.naturalWidth || 1,
                  height: event.currentTarget.naturalHeight || 1,
                })
              }
            />
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Zoom
            </label>
            <Input
              type="range"
              min="100"
              max="300"
              step="5"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="h-auto px-0"
            />
            <p className="mt-2 text-xs text-slate-500">{zoom}%</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Geser horizontal
            </label>
            <Input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={offsetX}
              onChange={(event) => setOffsetX(Number(event.target.value))}
              className="h-auto px-0"
            />
            <p className="mt-2 text-xs text-slate-500">{offsetX}%</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Geser vertikal
            </label>
            <Input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={offsetY}
              onChange={(event) => setOffsetY(Number(event.target.value))}
              className="h-auto px-0"
            />
            <p className="mt-2 text-xs text-slate-500">{offsetY}%</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onCancel} className="w-full sm:w-auto">
            Batal
          </Button>
          <Button
            type="button"
            onClick={() =>
              onConfirm(
                normalizeImageCrop({
                  x: offsetX,
                  y: offsetY,
                  zoom,
                })
              )
            }
            className="w-full sm:w-auto"
          >
            Gunakan hasil crop
          </Button>
        </div>
      </div>
    </div>
  );
}
