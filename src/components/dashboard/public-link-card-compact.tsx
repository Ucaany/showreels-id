"use client";

import Link from "next/link";
import { Copy, ExternalLink, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function PublicLinkCardCompact({
  profilePath,
  username,
}: {
  profilePath: string;
  username: string;
}) {
  const toast = useToast();
  const publicLink = typeof window !== "undefined"
    ? `${window.location.origin}${profilePath}`
    : profilePath;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicLink);
      toast.info("Link disalin", "Public link siap dibagikan ke client.");
    } catch {
      toast.error("Gagal menyalin link", "Coba lagi beberapa saat.");
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Showreels Profile",
          text: "Cek profil showreels saya:",
          url: publicLink,
        });
      } catch {
        // User closed share sheet
      }
    } else {
      await handleCopy();
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Public Link
          </p>
          <h3 className="mt-3 text-xl font-semibold text-slate-950">{profilePath}</h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
            Bagikan profil creator, link penting, bio, dan portfolio video ke client.
          </p>
        </div>
        <button
          onClick={handleShare}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-zinc-900 text-white shadow-sm hover:bg-zinc-800"
          aria-label="Share profile"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 max-sm:grid-cols-1">
        <button
          onClick={handleShare}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800"
        >
          <Share2 className="h-4 w-4" /> Share
        </button>
        <button
          onClick={handleCopy}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 hover:bg-slate-50"
        >
          <Copy className="h-4 w-4" /> Copy
        </button>
        <Link href={profilePath} target="_blank">
          <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 hover:bg-slate-50">
            <ExternalLink className="h-4 w-4" /> Open
          </button>
        </Link>
      </div>
    </section>
  );
}
