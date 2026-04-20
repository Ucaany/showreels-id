"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, Globe2, Share2 } from "lucide-react";
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
    <>
      <Button
        className="w-full"
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
    </>
  );
}
