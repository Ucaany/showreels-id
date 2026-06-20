"use client";

import HeroBadge from "./HeroBadge";
import { useState } from "react";
import Link from "next/link";
import { Check, X, ArrowRight } from "lucide-react";
import {
  YouTubeIcon,
  TikTokIcon,
  InstagramIcon,
  VimeoIcon,
  FacebookIcon,
  DriveIcon,
} from "./PlatformIcons";
import { useLang } from "@/lib/i18n/landing-context";
import { heroEN } from "@/lib/constants/landing-en";

const platformOrbs = [
  {
    name: "YouTube",
    icon: YouTubeIcon,
    color: "text-red-500",
    style: { top: "10%", left: "12%" },
    delay: 0,
    size: 52,
  },
  {
    name: "TikTok",
    icon: TikTokIcon,
    color: "text-zinc-800",
    style: { top: "18%", right: "11%" },
    delay: 500,
    size: 46,
  },
  {
    name: "Facebook",
    icon: FacebookIcon,
    color: "text-blue-600",
    style: { top: "46%", left: "9%" },
    delay: 1000,
    size: 44,
  },
  {
    name: "Drive",
    icon: DriveIcon,
    color: "",
    style: { top: "46%", right: "9%" },
    delay: 300,
    size: 46,
  },
  {
    name: "Vimeo",
    icon: VimeoIcon,
    color: "text-sky-400",
    style: { bottom: "20%", left: "12%" },
    delay: 800,
    size: 42,
  },
  {
    name: "Instagram",
    icon: InstagramIcon,
    color: "text-pink-500",
    style: { bottom: "20%", right: "11%" },
    delay: 1300,
    size: 42,
  },
];

function PlatformOrb({ orb }: { orb: (typeof platformOrbs)[number] }) {
  const Icon = orb.icon;
  return (
    <div
      className="absolute hidden lg:flex items-center justify-center"
      style={{
        ...orb.style,
        width: orb.size,
        height: orb.size,
        animation: `orbPulse 3.2s ease-in-out infinite`,
        animationDelay: `${orb.delay}ms`,
      }}
      title={orb.name}
    >
      <span
        className={`${orb.color} drop-shadow-lg flex`}
        style={{ width: orb.size, height: orb.size }}
      >
        <Icon className="w-full h-full" />
      </span>
    </div>
  );
}

function UsernameForm() {
  const { lang } = useLang();
  const isEN = lang === "EN";
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "available" | "taken">("idle");

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setStatus(username.toLowerCase() === "admin" ? "taken" : "available");
  };

  return (
    <div className="w-full max-w-[460px] mx-auto">
      <form
        onSubmit={check}
        className={`flex items-center rounded-2xl border transition-all ${
          status === "available"
            ? "border-brand-300 shadow-[0_0_0_3px_rgba(59,130,246,0.10)]"
            : status === "taken"
            ? "border-red-300 shadow-[0_0_0_3px_rgba(239,68,68,0.08)]"
            : "border-[#e2e8f0] shadow-[0_2px_16px_rgba(10,13,20,0.06)] focus-within:border-brand-300 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.10)]"
        }`}
      >
        <span className="shrink-0 pl-4 pr-1 text-[12.5px] font-medium text-ink/40 select-none">
          showreels.id/
        </span>
        <input
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""));
            setStatus("idle");
          }}
          placeholder={isEN ? "your-username" : "username-kamu"}
          autoComplete="off"
          spellCheck={false}
          className="flex-1 min-w-0 bg-transparent py-3.5 text-[13px] font-semibold text-ink outline-none placeholder:text-ink/25 placeholder:font-normal"
        />
        {username.length > 0 && (
          <button
            type="button"
            onClick={() => { setUsername(""); setStatus("idle"); }}
            className="shrink-0 mr-2 rounded-full p-1 text-ink/25 hover:text-ink/50 transition-colors"
            aria-label={isEN ? "Clear" : "Hapus"}
          >
            <X className="h-3 w-3" strokeWidth={2.5} />
          </button>
        )}
        <button
          type="submit"
          disabled={!username.trim()}
          className="m-1.5 shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-ink px-5 py-2.5 text-[12.5px] font-semibold text-white transition-all hover:bg-brand-600 disabled:opacity-35 disabled:cursor-not-allowed"
        >
          {isEN ? "Check" : "Cek"}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
        </button>
      </form>

      <div className="mt-2.5 min-h-[36px] text-center">
        {status === "idle" && null}
        {status === "available" && (
          <div className="flex flex-col items-center gap-2 animate-reveal">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-200 px-3.5 py-1">
              <Check className="h-3 w-3 text-brand-600" strokeWidth={2.6} />
              <span className="text-[12px] font-semibold text-brand-700">
                <span className="font-bold">showreels.id/{username}</span>{" "}
                {isEN ? "is available!" : "tersedia!"}
              </span>
            </div>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-1.5 text-[12px] font-semibold text-white shadow-[0_4px_16px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 transition-all hover:bg-brand-700"
            >
              {isEN ? "Register Now" : "Daftar Sekarang"}
              <ArrowRight className="h-3 w-3" strokeWidth={2.4} />
            </Link>
          </div>
        )}
        {status === "taken" && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3.5 py-1 animate-reveal">
            <X className="h-3 w-3 text-red-500" strokeWidth={2.5} />
            <span className="text-[12px] font-semibold text-red-600">
              {isEN ? "Username already taken, try another." : "Username sudah dipakai, coba yang lain."}
            </span>
          </div>
        )}
      </div>

    </div>
  );
}

export default function Hero() {
  const { lang } = useLang();
  const isEN = lang === "EN";

  return (
    <section
      id="home"
      className="relative overflow-hidden pt-24 pb-4 md:pt-32 md:pb-6"
    >
      <div className="absolute inset-0 -z-10 grid-bg-soft" aria-hidden />
      <div className="glow-blob h-[480px] w-[480px] bg-brand-500/[0.07] left-[2%] top-0 animate-blob" aria-hidden />
      <div className="glow-blob h-[360px] w-[360px] bg-brand-600/[0.05] right-[3%] top-32 animate-blob" aria-hidden />

      {platformOrbs.map((orb) => (
        <PlatformOrb key={orb.name} orb={orb} />
      ))}

      <div className="container mx-auto max-w-[680px] px-6 relative">
        <div className="flex justify-center animate-reveal">
          <HeroBadge />
        </div>

        <h1 className="mx-auto mt-7 max-w-[560px] text-center text-hero-display font-semibold text-ink animate-reveal [animation-delay:80ms] leading-[1.12] tracking-tight">
          {isEN ? (
            <>
              <span className="block">{heroEN.headline}</span>
              <span className="block">
                <span className="font-accent text-accent">{heroEN.headlineAccent}</span>
              </span>
            </>
          ) : (
            <>
              <span className="block">Satu link untuk</span>
              <span className="block">
                <span className="font-accent text-accent">semua karya video</span>{" "}
                terbaikmu.
              </span>
            </>
          )}
        </h1>

        <p className="mx-auto mt-5 max-w-[460px] text-center text-body-lg font-normal text-ink/60 animate-reveal [animation-delay:160ms]">
          {isEN
            ? heroEN.subheadline
            : "Portofolio video profesional dari YouTube, TikTok, Instagram, dan Vimeo — dalam satu halaman siap dibagikan."}
        </p>

        <div id="username" className="mt-8 animate-reveal [animation-delay:240ms]">
          <UsernameForm />
        </div>
      </div>
    </section>
  );
}
