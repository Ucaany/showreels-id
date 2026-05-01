import Link from "next/link";
import { Globe2 } from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaThreads,
  FaYoutube,
} from "react-icons/fa6";

interface SocialLinksProps {
  websiteUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  facebookUrl?: string;
  threadsUrl?: string;
  linkedinUrl?: string;
  className?: string;
  balanced?: boolean;
  variant?: "pill" | "icon-card";
}

const baseLinkClass =
  "inline-flex items-center gap-2 rounded-full border border-[#E1E1DF] bg-white px-3.5 py-2 text-xs font-semibold text-[#525252] transition hover:border-[#111111] hover:text-[#111111] hover:shadow-sm";

function PlatformIcon({
  platform,
  className,
}: {
  platform: "website" | "instagram" | "youtube" | "facebook" | "threads" | "linkedin";
  className: string;
}) {
  if (platform === "instagram") {
    return <FaInstagram className={className} />;
  }
  if (platform === "youtube") {
    return <FaYoutube className={className} />;
  }
  if (platform === "facebook") {
    return <FaFacebookF className={className} />;
  }
  if (platform === "threads") {
    return <FaThreads className={className} />;
  }
  if (platform === "linkedin") {
    return <FaLinkedinIn className={className} />;
  }

  return <Globe2 className={className} />;
}

export function SocialLinks({
  websiteUrl,
  instagramUrl,
  youtubeUrl,
  facebookUrl,
  threadsUrl,
  linkedinUrl,
  className = "",
  balanced = false,
  variant = "pill",
}: SocialLinksProps) {
  const items = [
    { key: "website", label: "Website", href: websiteUrl },
    { key: "instagram", label: "Instagram", href: instagramUrl },
    { key: "youtube", label: "YouTube", href: youtubeUrl },
    { key: "facebook", label: "Facebook", href: facebookUrl },
    { key: "threads", label: "Threads", href: threadsUrl },
    { key: "linkedin", label: "LinkedIn", href: linkedinUrl },
  ].filter((item) => item.href) as Array<{
    key: "website" | "instagram" | "youtube" | "facebook" | "threads" | "linkedin";
    label: string;
    href: string;
  }>;

  if (items.length === 0) {
    return null;
  }

  if (variant === "icon-card") {
    return (
      <div
        className={`${
          balanced ? "grid grid-cols-2 gap-2" : "grid grid-cols-2 gap-2 sm:grid-cols-3"
        } ${className}`.trim()}
      >
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex min-h-[3.35rem] items-center gap-2 rounded-[1.05rem] border border-[#d4e2f8] bg-white px-3 py-2.5 text-[#2a3f62] shadow-[0_8px_18px_rgba(28,72,145,0.07)] transition hover:border-[#2f73ff] hover:bg-[#f1f6ff]"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-[0.9rem] border border-[#d6e4f8] bg-[#f7fbff] text-[#2f73ff] transition group-hover:border-[#9cc0ff] group-hover:bg-white">
              <PlatformIcon platform={item.key} className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold leading-tight">{item.label}</span>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${
        balanced ? "grid grid-cols-2 gap-2.5" : "flex flex-wrap justify-center gap-2.5"
      } ${className}`.trim()}
    >
      {items.map((item) => {
        return (
          <Link
            key={item.key}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${baseLinkClass} ${balanced ? "w-full justify-center" : ""}`.trim()}
          >
            <PlatformIcon platform={item.key} className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
