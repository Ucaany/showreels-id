"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  Copy,
  Download,
  ExternalLink,
  MessageCircle,
  QrCode,
  Send,
  Share2,
  X,
} from "lucide-react";
import { SiInstagram } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { showFeedbackAlert } from "@/lib/feedback-alert";

type ShareProfileActionsProps = {
  username: string;
};

function getShareChannels(publicLink: string) {
  const encodedLink = encodeURIComponent(publicLink);
  const encodedText = encodeURIComponent("Cek profil showreels saya di sini:");

  return [
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedText}%20${encodedLink}`,
      icon: MessageCircle,
    },
    {
      id: "telegram",
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedLink}&text=${encodedText}`,
      icon: Send,
    },
    {
      id: "x",
      label: "X / Twitter",
      href: `https://x.com/intent/tweet?url=${encodedLink}&text=${encodedText}`,
      icon: Share2,
    },
  ] as const;
}

export function ShareProfileActions({ username }: ShareProfileActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const publicPath = `/creator/${username}`;
  const publicLink = useMemo(() => {
    if (typeof window === "undefined") {
      return publicPath;
    }
    return `${window.location.origin}${publicPath}`;
  }, [publicPath]);
  const qrImageSrc = useMemo(
    () => `/api/public/qr?data=${encodeURIComponent(publicLink)}`,
    [publicLink]
  );
  const shareChannels = useMemo(() => getShareChannels(publicLink), [publicLink]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      await showFeedbackAlert({
        title: "Link berhasil disalin",
        text: "Sekarang kamu bisa bagikan ke klien atau audiens.",
        icon: "success",
        timer: 1200,
      });
    } catch {
      await showFeedbackAlert({
        title: "Gagal menyalin link",
        text: "Coba lagi beberapa saat.",
        icon: "error",
      });
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator === "undefined" || !navigator.share) {
      await handleCopy();
      return;
    }

    try {
      await navigator.share({
        title: "Showreels Profile",
        text: "Cek profil showreels saya:",
        url: publicLink,
      });
    } catch {
      // User closed native share sheet.
    }
  };

  const handleInstagramFallback = async () => {
    await handleCopy();
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  };

  const handleDownloadQr = async () => {
    setIsDownloading(true);
    try {
      const downloadLink = document.createElement("a");
      downloadLink.href = qrImageSrc;
      downloadLink.download = `showreels-${username}-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      await showFeedbackAlert({
        title: "QR code berhasil diunduh",
        icon: "success",
        timer: 1200,
      });
    } catch {
      await showFeedbackAlert({
        title: "QR code gagal diunduh",
        text: "Coba lagi beberapa saat.",
        icon: "error",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => setIsOpen(true)}>
          <Share2 className="h-4 w-4" />
          Share Link
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={handleCopy}>
          <Copy className="h-4 w-4" />
          Copy Link
        </Button>
        <Link href={publicPath} target="_blank">
          <Button type="button" variant="secondary" size="sm">
            <ExternalLink className="h-4 w-4" />
            Buka Public Link
          </Button>
        </Link>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0f2347]/55 p-4">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close share modal backdrop"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative z-[91] w-full max-w-[560px] rounded-[1.4rem] border border-[#c8d9f4] bg-white p-4 shadow-xl sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f73ff]">
                  Share Link Postingan
                </p>
                <h3 className="mt-1 text-xl font-semibold text-[#1a2b48]">
                  Bagikan profil creator kamu
                </h3>
                <p className="mt-1 text-sm text-[#56709d]">
                  Pilih channel share, copy link, atau gunakan QR code.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#cfdcf2] text-[#44608d] hover:bg-[#eff5ff]"
                aria-label="Close share modal"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-[#d5e1f5] bg-[#f5f9ff] px-3 py-2">
              <p className="truncate text-sm font-medium text-[#2c4c80]">{publicLink}</p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {shareChannels.map((channel) => {
                const Icon = channel.icon;
                return (
                  <Link key={channel.id} href={channel.href} target="_blank">
                    <Button variant="secondary" className="w-full justify-start">
                      <Icon className="h-4 w-4" />
                      {channel.label}
                    </Button>
                  </Link>
                );
              })}
              <Button variant="secondary" className="justify-start" onClick={handleInstagramFallback}>
                <SiInstagram className="h-4 w-4" />
                Instagram
              </Button>
              <Button variant="secondary" className="justify-start" onClick={handleNativeShare}>
                <Share2 className="h-4 w-4" />
                Share Sheet
              </Button>
            </div>

            <div className="mt-4 rounded-xl border border-[#d5e1f5] bg-[#f9fbff] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1 text-sm font-semibold text-[#2c4c80]">
                  <QrCode className="h-4 w-4" />
                  QR Code
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownloadQr}
                  disabled={isDownloading}
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? "Mengunduh..." : "Unduh"}
                </Button>
              </div>
              <div className="mt-3 flex justify-center rounded-xl border border-[#dce7f8] bg-white p-3">
                <Image
                  src={qrImageSrc}
                  alt="QR code share profile"
                  width={160}
                  height={160}
                  className="h-40 w-40 rounded-lg object-cover"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
