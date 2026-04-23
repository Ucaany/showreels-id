"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Globe2, Share2 } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { AvatarBadge } from "@/components/avatar-badge";
import { VideoEmbed } from "@/components/video-embed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMockApp } from "@/hooks/use-mock-app";
import { formatDateLabel } from "@/lib/helpers";
import { getSocialShareLinks, getSourceLabel } from "@/lib/video-utils";

export default function PublicVideoClientPage({ slug }: { slug: string }) {
  const { ready, users, videos } = useMockApp();
  const [copied, setCopied] = useState(false);

  const video = useMemo(
    () => videos.find((item) => item.publicSlug === slug),
    [videos, slug]
  );
  const author = useMemo(
    () => users.find((user) => user.id === video?.userId),
    [users, video?.userId]
  );

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>Memuat halaman publik...</Card>
      </div>
    );
  }

  if (!video || !author) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-xl text-center">
          <h1 className="font-display text-2xl font-semibold text-slate-900">
            Video tidak ditemukan
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Slug <span className="font-semibold">/v/{slug}</span> belum tersedia
            atau sudah berubah.
          </p>
          <Link href="/" className="mt-5 inline-block">
            <Button>Kembali ke Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const currentUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://showreels.id/v/${video.publicSlug}`;
  const shareLinks = getSocialShareLinks(currentUrl, video.title);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <AppLogo />
          <Link href="/auth/login">
            <Button variant="secondary">Masuk Dashboard</Button>
          </Link>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
        className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px]"
      >
        <Card className="space-y-5">
          <div className="space-y-2">
            <Badge>{getSourceLabel(video.source)}</Badge>
            <h1 className="font-display text-3xl font-semibold text-slate-900">
              {video.title}
            </h1>
            <p className="text-sm text-slate-600">
              Dipublikasikan pada {formatDateLabel(video.createdAt)}
            </p>
          </div>

          <VideoEmbed sourceUrl={video.sourceUrl} source={video.source} title={video.title} />

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Deskripsi
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {video.description}
            </p>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Tentang Author
            </h2>
            <div className="flex items-center gap-3">
              <AvatarBadge
                name={author.fullName}
                avatarUrl={author.avatarUrl}
                size="lg"
              />
              <div>
                <p className="font-semibold text-slate-900">{author.fullName}</p>
                <p className="text-sm text-slate-600">@{author.username}</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              {author.bio || "Bio belum ditambahkan."}
            </p>
          </Card>

          <Card className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Bagikan Link
            </h2>
            <Button
              className="w-full"
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(currentUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1400);
              }}
            >
              <Copy className="h-4 w-4" />
              {copied ? "Link tersalin" : "Copy Link"}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Link href={shareLinks.x} target="_blank">
                <Button className="w-full" variant="ghost">
                  <Share2 className="h-4 w-4" />
                  X
                </Button>
              </Link>
              <Link href={shareLinks.facebook} target="_blank">
                <Button className="w-full" variant="ghost">
                  <Globe2 className="h-4 w-4" />
                  Facebook
                </Button>
              </Link>
            </div>
            <Link href={shareLinks.whatsapp} target="_blank">
              <Button className="w-full" variant="ghost">
                Bagikan ke WhatsApp
              </Button>
            </Link>
          </Card>
        </div>
      </motion.main>
    </div>
  );
}
