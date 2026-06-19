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
    <div className="flex min-h-screen items-center justify-center bg-[#fafaf8] px-4 py-10 sm:px-6">
      {/* Subtle background dot grid */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(15,23,42,0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[420px]">
        {/* Logo + preferences row */}
        <div className={`mb-7 flex items-center ${showPreferences ? "justify-between" : "justify-center"}`}>
          <AppLogo />
          {showPreferences ? <SitePreferences compact /> : null}
        </div>

        {/* Heading */}
        <div className="mb-6 text-center">
          <h1 className="font-display text-[1.75rem] font-extrabold tracking-[-0.035em] text-zinc-950">
            {title}
          </h1>
          <p className="mt-2 text-[0.88rem] leading-relaxed text-zinc-500">{subtitle}</p>
        </div>

        {/* Form content */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.05),0_12px_32px_rgba(15,23,42,0.06)] sm:p-7">
          {children}
        </div>

        {/* Back link */}
        <p className="mt-5 text-center text-[0.84rem] text-zinc-500">
          Kembali ke{" "}
          <Link
            href="/"
            className="font-semibold text-orange-600 transition-colors hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 rounded-sm"
          >
            landing page
          </Link>
        </p>
      </div>
    </div>
  );
}
