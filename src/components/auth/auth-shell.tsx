import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { SitePreferences } from "@/components/site-preferences";

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_12%_-3%,rgba(37,99,235,0.14),transparent_32%),radial-gradient(circle_at_90%_0%,rgba(239,79,63,0.14),transparent_28%),linear-gradient(180deg,rgba(253,251,249,0.96),rgba(247,243,239,0.98))] px-4 py-8 sm:py-12">
      <div className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-[#9dbdf8]/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#f5ae9f]/45 blur-3xl" />

      <div className="relative w-full max-w-lg rounded-[28px] border border-[#dfd5cf] bg-white/94 p-5 shadow-[0_24px_90px_rgba(28,22,19,0.13)] backdrop-blur sm:rounded-[32px] sm:p-7">
        <div className="mb-6 space-y-4 sm:mb-7">
          <div
            className={`flex items-center ${showPreferences ? "justify-between" : "justify-center"}`}
          >
            <AppLogo />
            {showPreferences ? <SitePreferences compact /> : null}
          </div>
          <div className="text-center">
            <h1 className="font-display text-3xl font-semibold text-[#1d1815]">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-7 text-[#655952]">{subtitle}</p>
          </div>
        </div>

        {children}

        <p className="mt-6 text-center text-sm text-[#655952]">
          Kembali ke{" "}
          <Link href="/" className="font-semibold text-[#e24f3b] hover:text-[#cf3f2c]">
            landing page
          </Link>
        </p>
      </div>
    </div>
  );
}

