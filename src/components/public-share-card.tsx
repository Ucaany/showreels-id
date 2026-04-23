"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, Globe2, Link2, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSocialShareLinks } from "@/lib/video-utils";

export function PublicShareCard({
  title,
  pathname,
}: {
  title: string;
  pathname: string;
}) {
  const [copied, setCopied] = useState(false);
  const currentUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${pathname}`
      : pathname;
  const shareLinks = getSocialShareLinks(currentUrl, title);

  return (
    <div className="space-y-3">
      <Button
        className="h-11 w-full"
        variant="secondary"
        onClick={async () => {
          await navigator.clipboard.writeText(currentUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
      >
        <Copy className="h-4 w-4" />
        {copied ? "Link tersalin" : "Copy Link"}
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Link href={shareLinks.facebook} target="_blank" className="w-full">
          <Button className="h-10 w-full rounded-xl px-3" variant="secondary">
            <Globe2 className="h-4 w-4" />
            Facebook
          </Button>
        </Link>
        <Link href={shareLinks.whatsapp} target="_blank" className="w-full">
          <Button className="h-10 w-full rounded-xl px-3" variant="secondary">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
        </Link>
        <Link href={shareLinks.threads} target="_blank" className="w-full">
          <Button className="h-10 w-full rounded-xl px-3" variant="secondary">
            <Share2 className="h-4 w-4" />
            Threads
          </Button>
        </Link>
        <Link href={shareLinks.instagram} target="_blank" className="w-full">
          <Button className="h-10 w-full rounded-xl px-3" variant="secondary">
            <Link2 className="h-4 w-4" />
            Instagram
          </Button>
        </Link>
      </div>
    </div>
  );
}
