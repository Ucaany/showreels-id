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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-brand-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-0 h-96 w-96 rounded-full bg-cyan-200/70 blur-3xl" />

      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-surface p-7 shadow-card backdrop-blur">
        <div className="mb-7 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <AppLogo />
            <SitePreferences />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-900">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{subtitle}</p>
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

