import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { SitePreferences } from "@/components/site-preferences";
import { FeatureNotification } from "@/components/auth/feature-notification";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  showPreferences?: boolean;
}

export function AuthShell({
  title,
  subtitle,
  children,
  showPreferences = true,
}: AuthShellProps) {
  return (
    <div className="min-h-screen lg:flex">
      {/* Video Section - Desktop Only, Fixed Position */}
      <div className="relative hidden overflow-hidden bg-[#0a1628] lg:fixed lg:left-0 lg:top-0 lg:block lg:h-screen lg:w-1/2">
        {/* Background Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          aria-hidden="true"
        >
          <source src="/hero-loop.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628]/80 via-[#1a2d4f]/70 to-[#0d1b35]/85" />
        
        {/* Feature Notification - Desktop Only */}
        <FeatureNotification />
      </div>

      {/* Form Section - Scrollable, Offset on Desktop */}
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_12%_-3%,rgba(14,165,233,0.18),transparent_34%),radial-gradient(circle_at_90%_0%,rgba(16,185,129,0.14),transparent_30%),radial-gradient(circle_at_70%_94%,rgba(168,85,247,0.11),transparent_30%),linear-gradient(180deg,rgba(249,252,255,0.98),rgba(240,249,255,0.96))] px-4 py-8 sm:py-12 lg:ml-[50%] lg:w-1/2 lg:bg-white">
        {/* Decorative Blurs - Mobile Only */}
        <div className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-sky-200/55 blur-3xl lg:hidden" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-emerald-100/60 blur-3xl lg:hidden" />

        <div className="relative w-full max-w-lg rounded-[28px] border border-sky-100 bg-white/96 p-5 shadow-[0_24px_90px_rgba(14,116,144,0.13)] backdrop-blur sm:rounded-[32px] sm:p-7 lg:border-none lg:bg-transparent lg:shadow-none lg:backdrop-blur-none">
          <div className="mb-6 space-y-4 sm:mb-7">
            <div
              className={`flex items-center ${showPreferences ? "justify-between" : "justify-center"}`}
            >
              <AppLogo />
              {showPreferences ? <SitePreferences compact /> : null}
            </div>
            <div className="text-center">
              <h1 className="font-display text-3xl font-semibold text-slate-950">
                {title}
              </h1>
              <p className="mt-2 text-sm leading-7 text-sky-800/80">{subtitle}</p>
            </div>
          </div>

          {children}

          <p className="mt-6 text-center text-sm text-slate-600">
            Kembali ke{" "}
            <Link href="/" className="font-semibold text-sky-700 hover:text-sky-800">
              landing page
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
