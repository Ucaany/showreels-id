import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { SitePreferences } from "@/components/site-preferences";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(239,246,255,0.98))] px-4 py-8 sm:py-12">
      <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-brand-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-cyan-200/50 blur-3xl" />

      <div className="relative w-full max-w-lg bg-transparent p-0 sm:rounded-[32px] sm:border sm:border-slate-200 sm:bg-white/95 sm:p-7 sm:shadow-[0_24px_90px_rgba(15,23,42,0.10)] sm:backdrop-blur">
        <div className="mb-6 space-y-4 sm:mb-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <AppLogo />
            <SitePreferences compact />
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold text-slate-950">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-7 text-slate-600">{subtitle}</p>
          </div>
        </div>

        {children}

        <p className="mt-6 text-center text-sm text-slate-600">
          Kembali ke{" "}
          <Link href="/" className="font-semibold text-brand-600 hover:text-brand-700">
            landing page
          </Link>
        </p>
      </div>
    </div>
  );
}

