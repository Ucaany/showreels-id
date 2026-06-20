import { AppLogo } from "@/components/app-logo";
import { SitePreferences } from "@/components/site-preferences";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  showPreferences?: boolean;
  footer?: React.ReactNode;
}

export function AuthShell({
  title,
  subtitle,
  children,
  showPreferences = true,
  footer,
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#fbfcfe] px-4 py-12 sm:py-16">
      {/* Decorative background — matches landing Hero style */}
      <div className="pointer-events-none absolute inset-0 -z-10 grid-bg" aria-hidden />
      <div
        className="glow-blob h-[480px] w-[480px] bg-brand-500/[0.07] left-[2%] top-0 animate-blob"
        aria-hidden
      />
      <div
        className="glow-blob h-[360px] w-[360px] bg-brand-600/[0.05] right-[3%] top-32 animate-blob"
        aria-hidden
      />

      {/* Top logo bar — transparent so it doesn't visually trap the card on mobile */}
      <div className="fixed top-0 left-0 right-0 z-20 w-full bg-transparent">
        <div className="container mx-auto max-w-[1180px] px-5 sm:px-6">
          <div className="flex h-[64px] items-center justify-between">
            <AppLogo />
            {showPreferences ? <SitePreferences compact /> : null}
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[420px] pt-4 sm:pt-10">
        <div className="rounded-[28px] border border-black/[0.08] bg-white/95 p-8 shadow-card backdrop-blur-sm sm:p-9">
          {/* Centered icon + heading */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-black/[0.08] bg-white text-ink shadow-soft">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
            </div>
            <h1 className="font-display text-[1.6rem] font-semibold tracking-[-0.03em] text-ink">
              {title}
            </h1>
            <p className="mx-auto mt-2.5 max-w-[280px] text-[0.875rem] font-normal leading-relaxed text-ink/60">
              {subtitle}
            </p>
          </div>

          {/* Form content */}
          {children}
        </div>

        {footer ? (
          <div className="mt-6 text-center text-[0.78rem] leading-relaxed text-ink/40">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
