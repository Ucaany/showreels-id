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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_12%_-3%,rgba(37,99,235,0.16),transparent_34%),radial-gradient(circle_at_90%_0%,rgba(67,117,255,0.16),transparent_30%),linear-gradient(180deg,rgba(249,252,255,0.98),rgba(243,248,255,0.96))] px-4 py-8 sm:py-12">
      <div className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-[#9dbdf8]/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#a7c7ff]/50 blur-3xl" />

      <div className="relative w-full max-w-lg rounded-[28px] border border-[#d4e1f5] bg-white/96 p-5 shadow-[0_24px_90px_rgba(21,55,115,0.12)] backdrop-blur sm:rounded-[32px] sm:p-7">
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
            <p className="mt-2 text-sm leading-7 text-[#4d638a]">{subtitle}</p>
          </div>
        </div>

        {children}

        <p className="mt-6 text-center text-sm text-[#4d638a]">
          Kembali ke{" "}
          <Link href="/" className="font-semibold text-[#2f73ff] hover:text-[#225fe0]">
            landing page
          </Link>
        </p>
      </div>
    </div>
  );
}

