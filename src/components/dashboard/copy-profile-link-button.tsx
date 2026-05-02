"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showFeedbackAlert } from "@/lib/feedback-alert";

export function CopyProfileLinkButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const origin = window.location.origin;
    const link = `${origin}/creator/${username}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
      await showFeedbackAlert({
        title: "Link berhasil disalin!",
        text: "Link profil berhasil disalin. Bagikan ke siapa saja.",
        icon: "success",
        timer: 1600,
      });
    } catch {
      await showFeedbackAlert({
        title: "Gagal menyalin link",
        text: "Silakan coba lagi beberapa saat.",
        icon: "error",
      });
    }
  };

  return (
    <Button type="button" variant="secondary" onClick={handleCopy}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Link tersalin" : "Salin Link Profil"}
    </Button>
  );
}
