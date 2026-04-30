"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Copy, Download, MessageCircle, QrCode, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSocialShareLinks } from "@/lib/video-utils";

export function PublicShareQrActions({
  title,
  pathname,
  showQr = true,
}: {
  title: string;
  pathname: string;
  showQr?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const absoluteUrl =
    typeof window === "undefined" ? pathname : `${window.location.origin}${pathname}`;

  useEffect(() => {
    if (!qrOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setQrOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [qrOpen]);

  const qrSrc = useMemo(
    () => `/api/public/qr?data=${encodeURIComponent(absoluteUrl)}`,
    [absoluteUrl]
  );
  const shareLinks = getSocialShareLinks(absoluteUrl, title);

  const copyLink = async () => {
    await navigator.clipboard.writeText(absoluteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title, url: absoluteUrl });
      return;
    }

    await copyLink();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" className="min-h-11 rounded-2xl bg-[#111111] text-white hover:bg-[#2b2b2b]" onClick={nativeShare}>
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button type="button" variant="secondary" className="min-h-11 rounded-2xl border-[#dededb] bg-white text-[#111111]" onClick={copyLink}>
          <Copy className="h-4 w-4" />
          {copied ? "Tersalin" : "Copy"}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="w-full">
          <Button type="button" variant="secondary" className="min-h-11 w-full rounded-2xl border-[#dededb] bg-white text-[#111111]">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
        </Link>
        <Link href={shareLinks.x} target="_blank" rel="noopener noreferrer" className="w-full">
          <Button type="button" variant="secondary" className="min-h-11 w-full rounded-2xl border-[#dededb] bg-white text-[#111111]">
            <Share2 className="h-4 w-4" />
            X/Twitter
          </Button>
        </Link>
      </div>

      {showQr ? (
        <Button type="button" variant="secondary" className="min-h-11 w-full rounded-2xl border-[#dededb] bg-white text-[#111111]" onClick={() => setQrOpen(true)}>
          <QrCode className="h-4 w-4" />
          Tampilkan QR Code
        </Button>
      ) : null}

      {qrOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-3 sm:items-center" role="dialog" aria-modal="true" aria-label="QR Code share">
          <div className="w-full max-w-sm rounded-[2rem] border border-[#dededb] bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#777]">QR Code</p>
                <h2 className="mt-1 line-clamp-2 text-xl font-semibold text-[#111111]">{title}</h2>
                <p className="mt-1 text-xs text-[#666]">showreels.id</p>
              </div>
              <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dededb] text-[#111111]" onClick={() => setQrOpen(false)} aria-label="Tutup QR Code">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-[1.5rem] border border-[#ededeb] bg-white p-4">
              <Image src={qrSrc} alt={`QR Code ${title}`} width={640} height={640} className="h-auto w-full rounded-xl" unoptimized />
            </div>
            <a href={qrSrc} download={`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-qr.png`} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#111111] px-4 text-sm font-semibold text-white">
              <Download className="h-4 w-4" />
              Download PNG
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
