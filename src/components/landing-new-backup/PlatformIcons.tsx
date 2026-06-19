"use client";

import { Play, Mail, Calendar } from "lucide-react";

const baseProps = {
  viewBox: "0 0 24 24",
  "aria-hidden": "true",
};

export function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M21.582 7.186a2.506 2.506 0 0 0-1.768-1.768C18.254 5 12 5 12 5s-6.254 0-7.814.418a2.506 2.506 0 0 0-1.768 1.768C2 8.746 2 12 2 12s0 3.254.418 4.814a2.506 2.506 0 0 0 1.768 1.768C5.746 19 12 19 12 19s6.254 0 7.814-.418a2.506 2.506 0 0 0 1.768-1.768C22 15.254 22 12 22 12s0-3.254-.418-4.814ZM10 15V9l5 3-5 3Z" />
    </svg>
  );
}

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.93a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.36Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function VimeoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.479 4.797l.001.012Z" />
    </svg>
  );
}

export function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
    </svg>
  );
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.52 3.48A11.87 11.87 0 0 0 12 0C5.37 0 .03 5.34.03 11.97c0 2.11.55 4.18 1.6 6L0 24l6.18-1.62A11.94 11.94 0 0 0 12 24c6.63 0 11.97-5.34 11.97-11.97 0-3.2-1.25-6.21-3.45-8.55ZM12 21.82a9.85 9.85 0 0 1-5.02-1.37l-.36-.21-3.67.96.98-3.58-.23-.37A9.86 9.86 0 1 1 21.82 12c0 5.43-4.4 9.82-9.82 9.82Zm5.39-7.36c-.3-.15-1.74-.86-2.01-.96-.27-.1-.46-.15-.66.15s-.76.96-.93 1.16c-.17.2-.34.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.74-1.64-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.34.46-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.91-2.19-.24-.58-.49-.5-.66-.51h-.56c-.2 0-.5.07-.76.34-.27.27-1.01.99-1.01 2.41 0 1.42 1.04 2.79 1.18 2.98.15.2 2.04 3.11 4.93 4.36.69.3 1.23.47 1.65.6.69.22 1.32.19 1.81.11.55-.08 1.74-.71 1.99-1.4.24-.69.24-1.27.17-1.4-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}

export function DribbbleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94" />
      <path d="M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32" />
      <path d="M8.56 2.75c4.37 6 6 9.42 8 17.72" />
    </svg>
  );
}

export function BehanceIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8.84 10.36c1.14-.45 1.83-1.45 1.83-2.78 0-1.7-1.16-2.88-3.55-2.88H1v14.6h6.32c2.6 0 4.28-1.24 4.28-3.43 0-1.6-.93-2.6-2.76-3.07Zm-5.59-3.51h3.43c1.05 0 1.7.45 1.7 1.32 0 .86-.65 1.32-1.7 1.32H3.25Zm3.7 9.36H3.25v-3.13h3.7c1.4 0 2.14.5 2.14 1.57s-.74 1.56-2.14 1.56Zm9.18-9.45c-3.65 0-5.6 2.4-5.6 5.45 0 3.18 2.05 5.46 5.6 5.46 2.55 0 4.41-1.18 5.04-3.4h-2.3c-.36.79-1.3 1.3-2.66 1.3-1.83 0-2.94-1.04-3.16-2.74h8.27v-.78c0-3.04-1.91-5.3-5.2-5.3Zm-2.94 4.36c.18-1.62 1.16-2.55 2.86-2.55 1.66 0 2.6.96 2.6 2.55Zm1.43-7.43h5.7v1.66h-5.7Z" />
    </svg>
  );
}

export function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.18 2c5.78 0 9.81 4.04 9.81 10.05 0 5.42-3.6 9.95-9.81 9.95-3.41 0-5.92-1.21-7.55-3.34l1.46-1.18c1.34 1.74 3.36 2.7 6.09 2.7 5.13 0 7.9-3.61 7.9-8.13 0-4.96-3.18-8.21-7.9-8.21-2.95 0-5.27 1.32-6.43 3.62l1.45 1.16c.94-1.93 2.65-2.93 4.98-2.93 3.78 0 5.98 2.31 5.98 6.05 0 .43-.04.84-.1 1.22-.45-1.34-1.94-2.27-3.74-2.27-2.6 0-4.43 1.5-4.43 3.7 0 2.16 1.83 3.66 4.43 3.66 2.6 0 4.42-1.5 4.42-3.66 0-3.79-2.95-6.32-7.42-6.32-3.66 0-6.36 1.6-7.96 4.36l-1.4-1.13C5.6 4.41 8.31 2 12.18 2Zm-.18 12.83c-1.39 0-2.36-.65-2.36-1.71 0-1.1.97-1.76 2.36-1.76 1.43 0 2.41.66 2.41 1.76 0 1.06-.98 1.71-2.41 1.71Z" />
    </svg>
  );
}

export function DriveIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 87.3 78"
      fill="none"
      aria-hidden="true"
    >
      <path d="M6.6 66.85L3.3 72.9c-.7 1.2-.3 2.7.9 3.4l12.9 7.5 3.4-5.9z" fill="#0066DA" />
      <path d="M53.1 66.85H6.6L20.5 78h32.6z" fill="#0066DA" />
      <path d="M53.1 66.85l3.3 6.05 10.4 5.1L80.7 72l3.3-5.15z" fill="#EA4335" />
      <path d="M80.7 72l-14-5.15L53.1 66.85H6.6L20.5 78h32.6l14.7 0 9.6-5.1z" fill="#EA4335" />
      <path d="M53.1 66.85l14-24.2L53.7 18.1l-24.4 42.2z" fill="#00AC47" />
      <path d="M80.7 72L67.1 42.65 53.1 66.85z" fill="#00832D" />
      <path d="M53.7 18.1L29.3 60.3l-22.7 6.55H53.1L67.1 42.65z" fill="#00AC47" />
      <path d="M6.6 66.85l22.7-6.55L14.4 33.95z" fill="#FFBA00" />
      <path d="M29.3 60.3L14.4 33.95 6.6 66.85z" fill="#FFBA00" />
      <path d="M33.35 11.55L14.4 33.95l14.9 26.35L53.7 18.1z" fill="#FF6D00" />
      <path d="M53.7 18.1L33.35 11.55l-18.95 22.4L53.7 18.1z" fill="#FF6D00" />
      <path d="M53.7 18.1L33.35 11.55 43.5 0l10.2 18.1z" fill="#FF6D00" />
      <path d="M43.5 0l-10.15 11.55L53.7 18.1z" fill="#FF6D00" />
    </svg>
  );
}

export function MoreIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </svg>
  );
}

export function PlayIcon({ className }: { className?: string }) {
  return <Play className={className} fill="currentColor" />;
}

export function MailIcon({ className }: { className?: string }) {
  return <Mail className={className} />;
}

export function CalendarIcon({ className }: { className?: string }) {
  return <Calendar className={className} />;
}

export function PlatformIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  switch (name) {
    case "youtube":
      return <YouTubeIcon className={className} />;
    case "tiktok":
      return <TikTokIcon className={className} />;
    case "instagram":
      return <InstagramIcon className={className} />;
    case "vimeo":
      return <VimeoIcon className={className} />;
    case "facebook":
      return <FacebookIcon className={className} />;
    case "whatsapp":
      return <WhatsAppIcon className={className} />;
    case "dribbble":
      return <DribbbleIcon className={className} />;
    case "behance":
      return <BehanceIcon className={className} />;
    case "threads":
      return <ThreadsIcon className={className} />;
    case "drive":
      return <DriveIcon className={className} />;
    case "more":
      return <MoreIcon className={className} />;
    case "play":
      return <PlayIcon className={className} />;
    case "mail":
      return <MailIcon className={className} />;
    case "calendar":
      return <CalendarIcon className={className} />;
    default:
      return null;
  }
}
