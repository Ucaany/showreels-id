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
  compact = false,
}: {
  title: string;
  pathname: string;
  showQr?: boolean;
  compact?: boolean;
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

  const primaryButtonClass = "min-h-11 rounded-2xl bg-[#111111] text-white shadow-[0_12px_26px_rgba(17,17,17,0.14)] hover:bg-[#1E1E1E] focus-visible:ring-[#111111]/25 [&_svg]:text-white";
  const secondaryButtonClass = "min-h-11 rounded-2xl border-[#dededb] bg-white text-[#111111] hover:bg-[#F5F5F4]";
  const gridClass = compact ? "grid grid-cols-1 gap-2 sm:grid-cols-2" : "grid grid-cols-2 gap-2 max-[360px]:grid-cols-1";

  return (
    <div className="space-y-3">
      <div className={gridClass}>
        <Button type="button" className={primaryButtonClass} onClick={nativeShare}>
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button type="button" variant="secondary" className={secondaryButtonClass} onClick={copyLink}>
          <Copy className="h-4 w-4" />
          {copied ? "Tersalin" : "Copy"}
        </Button>
      </div>

      {!compact ? (
        <div className="grid grid-cols-2 gap-2 max-[360px]:grid-cols-1">
          <Link href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button type="button" variant="secondary" className={`${secondaryButtonClass} w-full`}>
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          </Link>
          <Link href={shareLinks.x} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button type="button" variant="secondary" className={`${secondaryButtonClass} w-full`}>
              <Share2 className="h-4 w-4" />
              X/Twitter
            </Button>
          </Link>
        </div>
      ) : null}

      {showQr ? (
        <Button type="button" variant="secondary" className={`${secondaryButtonClass} w-full`} onClick={() => setQrOpen(true)}>
          <QrCode className="h-4 w-4" />
          Tampilkan QR Code
        </Button>
      ) : null}

      {qrOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="QR Code share">
          <div className="max-h-[80vh] w-full max-w-[calc(100vw-32px)] overflow-y-auto rounded-t-[2rem] border border-[#dededb] bg-white p-4 shadow-2xl sm:max-w-sm sm:rounded-[2rem]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#777]">QR Code</p>
                <h2 className="mt-1 line-clamp-2 text-xl font-semibold text-[#111111]">{title}</h2>
                <p className="mt-1 text-xs text-[#666]">showreels.id</p>
              </div>
              <button type="button" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dededb] text-[#111111]" onClick={() => setQrOpen(false)} aria-label="Tutup QR Code">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-[1.5rem] border border-[#ededeb] bg-white p-4">
              <Image src={qrSrc} alt={`QR Code ${title}`} width={640} height={640} className="h-auto w-full rounded-xl" unoptimized />
            </div>
            <a href={qrSrc} download={`${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-qr.png`} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#111111] px-4 text-sm font-semibold text-white hover:bg-[#1E1E1E]">
              <Download className="h-4 w-4 text-white" />
              Download PNG
            </a>
            <button type="button" className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#dededb] bg-white px-4 text-sm font-semibold text-[#111111]" onClick={copyLink}>
              <Copy className="h-4 w-4" />
              {copied ? "Link tersalin" : "Copy Link"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
