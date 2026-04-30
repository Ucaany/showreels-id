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
    <div className="min-h-screen bg-zinc-200 px-4 py-6 text-slate-950 sm:px-6 lg:flex lg:items-center lg:justify-center lg:px-8 lg:py-10">
      <div className="grid min-h-[calc(100vh-3rem)] w-full max-w-[1120px] overflow-hidden rounded-[2rem] bg-white p-3 shadow-[0_24px_80px_rgba(15,23,42,0.22)] ring-1 ring-black/5 lg:min-h-[720px] lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)] lg:gap-4 lg:rounded-[2.25rem] lg:p-4">
        {/* Video Section - Desktop Only */}
        <div className="relative hidden min-h-[688px] overflow-hidden rounded-[1.5rem] border border-zinc-800 bg-zinc-950 shadow-[0_20px_70px_rgba(15,23,42,0.22)] ring-1 ring-white/10 lg:block">
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
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.44),rgba(9,9,11,0.18)_35%,rgba(9,9,11,0.9))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_54%_43%,rgba(26,70,201,0.58),transparent_30%),radial-gradient(circle_at_54%_43%,rgba(255,255,255,0.18),transparent_17%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,9,11,0.48),transparent_52%,rgba(9,9,11,0.28))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,transparent_42%,rgba(9,9,11,0.7)_100%)]" />

          <div className="relative z-10 flex h-full flex-col justify-end p-7 text-white xl:p-8">
            <div className="max-w-[28rem] pb-5">
              <div className="mb-4 flex -space-x-2">
                {["S", "R", "I", "D"].map((item) => (
                  <span
                    key={item}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 bg-white/15 text-[0.68rem] font-extrabold text-white shadow-sm backdrop-blur"
                  >
                    {item}
                  </span>
                ))}
                <span className="ml-3 self-center text-[0.68rem] font-semibold text-white/70">
                  Trusted by creative teams
                </span>
              </div>
              <h2 className="font-display text-[clamp(2.35rem,4.45vw,4.5rem)] font-extrabold leading-[0.92] tracking-[-0.07em] text-white">
                Your work,
                <br /> always ready.
              </h2>
              <p className="mt-4 max-w-[24rem] text-[0.78rem] leading-5 text-white/68">
                Portfolio, video, dan profil publik dalam satu ruang visual yang rapi dan siap dibagikan.
              </p>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="relative flex min-h-[calc(100vh-4.5rem)] items-center justify-center overflow-hidden rounded-[1.5rem] bg-white px-4 py-8 sm:px-8 sm:py-10 lg:min-h-[688px] lg:px-10 xl:px-14">
          <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-[#dbe5ff]/55 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-slate-100 blur-3xl" />

          <div className="relative z-10 w-full max-w-md">
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
    </div>
  );
}
