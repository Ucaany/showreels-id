"use client";

import { AppLogo } from "@/components/app-logo";
import { FullWidthDivider } from "@/components/full-width-divider";
import { SitePreferences } from "@/components/site-preferences";
import { Particles } from "@/components/ui/particles";

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
    <div className="relative w-full overflow-hidden px-4" style={{ minHeight: "100svh" }}>
      <Particles className="absolute inset-0 -z-10" color="#2563eb" ease={20} quantity={80} />
      <div className="relative mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center border-x border-black/[0.06]">
        {/* Header area */}
        <div className="flex flex-col space-y-6 px-6 pt-8">
          <div className="flex items-center justify-between">
            <AppLogo />
            {showPreferences ? <SitePreferences compact /> : null}
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
            <p className="text-sm text-ink/60">{subtitle}</p>
          </div>
        </div>
        {/* Form area */}
        <div className="relative my-6 flex flex-col gap-4 px-6 py-8">
          <FullWidthDivider position="top" />
          {children}
          <FullWidthDivider position="bottom" />
        </div>
        {/* Footer */}
        {footer ? (
          <div className="px-6 pb-8 text-center text-[0.75rem] leading-relaxed text-ink/40">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
