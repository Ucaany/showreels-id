"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ImageCropDialogProps = {
  aspectRatio: number;
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (croppedImage: string) => void;
  open: boolean;
  shape?: "rect" | "circle";
  title: string;
};

const FRAME_WIDTH = 520;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function ImageCropDialog({
  aspectRatio,
  imageSrc,
  onCancel,
  onConfirm,
  open,
  shape = "rect",
  title,
}: ImageCropDialogProps) {
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });

  const frameHeight = useMemo(
    () => Math.max(220, Math.round(FRAME_WIDTH / aspectRatio)),
    [aspectRatio]
  );

  const renderedSize = useMemo(() => {
    const baseScale = Math.max(
      FRAME_WIDTH / naturalSize.width,
      frameHeight / naturalSize.height
    );

    return {
      width: naturalSize.width * baseScale * zoom,
      height: naturalSize.height * baseScale * zoom,
    };
  }, [frameHeight, naturalSize.height, naturalSize.width, zoom]);

  const offsetBounds = useMemo(
    () => ({
      x: Math.max(0, (renderedSize.width - FRAME_WIDTH) / 2),
      y: Math.max(0, (renderedSize.height - frameHeight) / 2),
    }),
    [frameHeight, renderedSize.height, renderedSize.width]
  );

  if (!open) {
    return null;
  }

  const clampedOffsetX = clamp(offsetX, -offsetBounds.x, offsetBounds.x);
  const clampedOffsetY = clamp(offsetY, -offsetBounds.y, offsetBounds.y);
  const left = (FRAME_WIDTH - renderedSize.width) / 2 + clampedOffsetX;
  const top = (frameHeight - renderedSize.height) / 2 + clampedOffsetY;

  const handleApply = () => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const outputWidth = shape === "circle" ? 900 : 1600;
      const outputHeight = Math.round(outputWidth / aspectRatio);
      const canvas = document.createElement("canvas");
      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      const sourceX = clamp(
        ((0 - left) / renderedSize.width) * naturalSize.width,
        0,
        naturalSize.width
      );
      const sourceY = clamp(
        ((0 - top) / renderedSize.height) * naturalSize.height,
        0,
        naturalSize.height
      );
      const sourceWidth = clamp(
        (FRAME_WIDTH / renderedSize.width) * naturalSize.width,
        1,
        naturalSize.width
      );
      const sourceHeight = clamp(
        (frameHeight / renderedSize.height) * naturalSize.height,
        1,
        naturalSize.height
      );

      if (shape === "circle") {
        context.save();
        context.beginPath();
        context.arc(
          outputWidth / 2,
          outputHeight / 2,
          Math.min(outputWidth, outputHeight) / 2,
          0,
          Math.PI * 2
        );
        context.closePath();
        context.clip();
      }

      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );

      if (shape === "circle") {
        context.restore();
      }

      onConfirm(
        shape === "circle"
          ? canvas.toDataURL("image/png")
          : canvas.toDataURL("image/jpeg", 0.92)
      );
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="w-full max-w-3xl rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
              Crop image
            </p>
            <h3 className="mt-1 text-xl font-semibold text-slate-950">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">
              Sesuaikan posisi gambar agar hasil avatar atau cover lebih rapi.
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

        <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.16),_transparent_42%),linear-gradient(180deg,_rgba(248,250,252,0.95),_rgba(226,232,240,0.85))] p-4">
          <div
            className={`relative mx-auto overflow-hidden border border-white/80 bg-slate-950/8 shadow-inner ${
              shape === "circle" ? "rounded-full" : "rounded-[24px]"
            }`}
            style={{ width: FRAME_WIDTH, height: frameHeight }}
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

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Zoom
            </label>
            <Input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="h-auto px-0"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Geser horizontal
            </label>
            <Input
              type="range"
              min={-offsetBounds.x}
              max={offsetBounds.x}
              step="1"
              value={clampedOffsetX}
              onChange={(event) =>
                setOffsetX(
                  clamp(
                    Number(event.target.value),
                    -offsetBounds.x,
                    offsetBounds.x
                  )
                )
              }
              className="h-auto px-0"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Geser vertikal
            </label>
            <Input
              type="range"
              min={-offsetBounds.y}
              max={offsetBounds.y}
              step="1"
              value={clampedOffsetY}
              onChange={(event) =>
                setOffsetY(
                  clamp(
                    Number(event.target.value),
                    -offsetBounds.y,
                    offsetBounds.y
                  )
                )
              }
              className="h-auto px-0"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Batal
          </Button>
          <Button type="button" onClick={handleApply}>
            Gunakan hasil crop
          </Button>
        </div>
      </div>
    </div>
  );
}
