"use client";

export function FlagIcon({ code, className }: { code: "ID" | "EN"; className?: string }) {
  if (code === "ID") {
    return (
      <svg viewBox="0 0 24 16" className={className} aria-hidden>
        <rect width="24" height="16" rx="2" fill="#fff" />
        <rect width="24" height="8" rx="2" fill="#E70011" />
        <rect y="8" width="24" height="8" fill="#fff" />
        <rect width="24" height="16" rx="2" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden>
      <rect width="24" height="16" rx="2" fill="#012169" />
      <path d="M0,0 L24,16 M24,0 L0,16" stroke="#fff" strokeWidth="3.2" />
      <path d="M0,0 L24,16 M24,0 L0,16" stroke="#C8102E" strokeWidth="1.6" />
      <path d="M12,0 L12,16 M0,8 L24,8" stroke="#fff" strokeWidth="5.3" />
      <path d="M12,0 L12,16 M0,8 L24,8" stroke="#C8102E" strokeWidth="3.2" />
      <rect width="24" height="16" rx="2" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
    </svg>
  );
}
