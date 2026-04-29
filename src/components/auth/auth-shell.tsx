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
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Video Section - Desktop Only, Fixed Position */}
      <div className="relative hidden overflow-hidden bg-zinc-950 lg:fixed lg:left-0 lg:top-0 lg:block lg:h-screen lg:w-1/2">
        {/* Background Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-55 grayscale"
          aria-hidden="true"
        >
          <source src="/hero-loop.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(9,9,11,0.88),rgba(24,24,27,0.74),rgba(26,70,201,0.34),rgba(9,9,11,0.9))]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
        
        {/* Feature Notification - Desktop Only */}
        <FeatureNotification />
      </div>

      {/* Form Section - Scrollable, Offset on Desktop */}
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_12%_-3%,rgba(26,70,201,0.13),transparent_34%),radial-gradient(circle_at_90%_0%,rgba(15,23,42,0.08),transparent_30%),linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.96))] px-4 py-8 sm:py-12 lg:ml-[50%] lg:w-1/2">
        {/* Decorative Blurs - Mobile Only */}
        <div className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-[#dbe5ff]/70 blur-3xl lg:hidden" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-slate-200/70 blur-3xl lg:hidden" />

        <div className="relative w-full max-w-lg rounded-[28px] border border-slate-200 bg-white/96 p-5 shadow-[0_24px_90px_rgba(15,23,42,0.10)] backdrop-blur sm:rounded-[32px] sm:p-7 lg:border-none lg:bg-transparent lg:shadow-none lg:backdrop-blur-none">
          <div className="mb-6 space-y-4 sm:mb-7">
            <div
              className={`flex items-center ${showPreferences ? "justify-between" : "justify-center"}`}
            >
              <AppLogo />
              {showPreferences ? <SitePreferences compact /> : null}
            </div>
            <div className="text-center">
              <h1 className="font-display text-3xl font-extrabold tracking-[-0.035em] text-slate-950">
                {title}
              </h1>
              <p className="mt-2 text-sm leading-7 text-slate-600">{subtitle}</p>
            </div>
          </div>

          {children}

          <p className="mt-6 text-center text-sm text-slate-600">
            Kembali ke{" "}
            <Link href="/" className="font-semibold text-[#1a46c9] hover:text-[#153aa8]">
              landing page
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
