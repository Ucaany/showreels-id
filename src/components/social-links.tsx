import Link from "next/link";
import { Globe2, Link2, PlayCircle, Share2 } from "lucide-react";

interface SocialLinksProps {
  websiteUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  facebookUrl?: string;
  threadsUrl?: string;
  className?: string;
  balanced?: boolean;
}

const baseLinkClass =
  "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-700";

export function SocialLinks({
  websiteUrl,
  instagramUrl,
  youtubeUrl,
  facebookUrl,
  threadsUrl,
  className = "",
  balanced = false,
}: SocialLinksProps) {
  const items = [
    { key: "website", label: "Website", href: websiteUrl, icon: Globe2 },
    { key: "instagram", label: "Instagram", href: instagramUrl, icon: Globe2 },
    { key: "youtube", label: "YouTube", href: youtubeUrl, icon: PlayCircle },
    { key: "facebook", label: "Facebook", href: facebookUrl, icon: Share2 },
    { key: "threads", label: "Threads", href: threadsUrl, icon: Link2 },
  ].filter((item) => item.href);

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className={`${
        balanced ? "grid grid-cols-2 gap-2" : "flex flex-wrap gap-2"
      } ${className}`.trim()}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href as string}
            target="_blank"
            rel="noopener noreferrer"
            className={`${baseLinkClass} ${balanced ? "w-full justify-center" : ""}`.trim()}
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
