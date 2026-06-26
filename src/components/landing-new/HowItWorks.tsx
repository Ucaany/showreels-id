"use client";

import { useState } from "react";
import {
  Package,
  Link2,
  Share2,
  CheckCircle2,
  PlayCircle,
  Play,
  Copy,
  ArrowRight,
  Zap,
  Globe,
  BarChart3,
} from "lucide-react";
import { useLang } from "@/lib/i18n/landing-context";
import { howItWorksEN } from "@/lib/constants/landing-en";

const stepsID = [
  {
    id: "pricing",
    step: "01",
    label: "Pilih Paket",
    icon: Package,
    heading: "Mulai gratis, upgrade kapan saja",
    body: "Tidak perlu kartu kredit. Pilih paket Free atau langsung Creator untuk fitur penuh.",
    accent: "from-brand-500 to-brand-600",
    accentSoft: "bg-brand-50",
    accentText: "text-brand-700",
    accentBorder: "border-brand-200",
    result: { label: "Akun aktif dalam", value: "< 1 menit", icon: Zap },
  },
  {
    id: "builder",
    step: "02",
    label: "Tambah Video",
    icon: Link2,
    heading: "Username custom, semua platform",
    body: "Daftarkan username unikmu dan sambungkan YouTube, TikTok, Instagram, Vimeo dalam satu klik.",
    accent: "from-violet-500 to-violet-600",
    accentSoft: "bg-violet-50",
    accentText: "text-violet-700",
    accentBorder: "border-violet-200",
    result: { label: "Link siap pakai di", value: "showreels.id/kamu", icon: Globe },
  },
  {
    id: "share",
    step: "03",
    label: "Publish & Bagikan",
    icon: Share2,
    heading: "Satu link, semua platform",
    body: "Bagikan ke Instagram bio, TikTok, LinkedIn, atau WhatsApp. Pantau views dan klik real-time.",
    accent: "from-emerald-500 to-emerald-600",
    accentSoft: "bg-emerald-50",
    accentText: "text-emerald-700",
    accentBorder: "border-emerald-200",
    result: { label: "Rata-rata klik pertama dalam", value: "24 jam", icon: BarChart3 },
  },
];

export default function HowItWorks() {
  const { lang } = useLang();
  const isEN = lang === "EN";
  const steps = isEN
    ? howItWorksEN.steps.map((s) => ({
        id: s.id,
        step: s.step,
        label: s.label,
        icon: s.id === "pricing" ? Package : s.id === "builder" ? Link2 : Share2,
        heading: s.heading,
        body: s.body,
        accent: s.id === "pricing" ? "from-brand-500 to-brand-600" : s.id === "builder" ? "from-violet-500 to-violet-600" : "from-emerald-500 to-emerald-600",
        accentSoft: s.id === "pricing" ? "bg-brand-50" : s.id === "builder" ? "bg-violet-50" : "bg-emerald-50",
        accentText: s.id === "pricing" ? "text-brand-700" : s.id === "builder" ? "text-violet-700" : "text-emerald-700",
        accentBorder: s.id === "pricing" ? "border-brand-200" : s.id === "builder" ? "border-violet-200" : "border-emerald-200",
        result: { label: s.result.label, value: s.result.value, icon: s.id === "pricing" ? Zap : s.id === "builder" ? Globe : BarChart3 },
      }))
    : stepsID;

  const [active, setActive] = useState(0);
  const step = steps[active];
  const ResultIcon = step.result.icon;

  return (
    <section id="cara-kerja" className="relative py-16 md:py-24">
      <div className="absolute inset-0 -z-10 grid-bg-soft" aria-hidden />

      <div className="container mx-auto max-w-[1100px] px-6">
        {/* header */}
        <div className="mb-12 flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-3 text-ink/35">
            <span className="h-px w-10 bg-current" />
            <span className="rounded-full border border-brand-100 bg-white px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-700">
              {isEN ? howItWorksEN.eyebrow : "CARA KERJA"}
            </span>
            <span className="h-px w-10 bg-current" />
          </div>
          <h2 className="text-section-display font-semibold text-ink">
            {isEN ? (
              <>
                {howItWorksEN.headline}{" "}
                <span className="font-accent text-accent">{howItWorksEN.headlineAccent}</span>
              </>
            ) : (
              <>
                Fast &amp;{" "}
                <span className="font-accent text-accent">Easy</span>
              </>
            )}
          </h2>
          <p className="mt-3 max-w-md text-body-base text-ink/55">
            {isEN
              ? howItWorksEN.subheadline
              : "Mulai gunakan Showreels dalam 3 langkah sederhana dan cepat."}
          </p>
        </div>

        {/* layout: steps left, phone right */}
        <div className="grid items-center gap-10 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_360px]">

          {/* LEFT: step list */}
          <div className="flex flex-col gap-3 px-3">
            {steps.map((s, idx) => {
              const StepIcon = s.icon;
              const isActive = idx === active;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(idx)}
                  className={`group relative flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-300 ${
                    isActive
                      ? "border-brand-200 bg-transparent shadow-[0_4px_24px_rgba(37,99,235,0.10)]"
                      : "border-[color:var(--border)] bg-transparent hover:border-brand-100"
                  }`}
                >
                  {/* active indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-10 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-500" />
                  )}

                  {/* icon */}
                  <span
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                      isActive
                        ? `bg-gradient-to-br ${s.accent} shadow-md`
                        : "bg-ink/6 group-hover:bg-ink/10"
                    }`}
                  >
                    <StepIcon
                      className={`h-5 w-5 ${isActive ? "text-white" : "text-ink/40"}`}
                      strokeWidth={2.2}
                    />
                  </span>

                  {/* text */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9.5px] font-semibold uppercase tracking-[0.16em] ${
                          isActive ? "text-brand-600" : "text-ink/30"
                        }`}
                      >
                        {isEN ? "STEP" : "LANGKAH"} {idx + 1}
                      </span>
                    </div>
                    <div
                      className={`mt-0.5 text-[14px] font-semibold leading-snug ${
                        isActive ? "text-ink" : "text-ink/50"
                      }`}
                    >
                      {s.label}
                    </div>
                    {isActive && (
                      <p className="mt-1.5 text-[12px] leading-relaxed text-ink/50">
                        {s.body}
                      </p>
                    )}
                  </div>

                  {/* step number pill */}
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                      isActive
                        ? `${s.accentSoft} ${s.accentText}`
                        : "bg-ink/5 text-ink/25"
                    }`}
                  >
                    {s.step}
                  </span>
                </button>
              );
            })}

            {/* result strip */}
            <div className="mt-1 flex items-center justify-between rounded-xl border border-[color:var(--border-soft)] bg-white px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50">
                  <ResultIcon className="h-3.5 w-3.5 text-brand-500" strokeWidth={2.2} />
                </span>
                <span className="text-[11.5px] text-ink/50">{step.result.label}</span>
              </div>
              <span className="text-[12px] font-semibold text-ink">{step.result.value}</span>
            </div>

            {/* next / cta */}
            <div className="pl-1">
              {active < steps.length - 1 ? (
                <button
                  onClick={() => setActive(active + 1)}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-brand-600 transition-all hover:gap-3"
                >
                  {isEN ? howItWorksEN.nextStep : "Langkah berikutnya"}
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              ) : (
                <a
                  href="#cta"
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 transition-all hover:gap-3"
                >
                  {isEN ? howItWorksEN.readyCta : "Siap? Mulai sekarang"}
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                </a>
              )}
            </div>

            {/* progress dots */}
            <div className="flex items-center gap-2 pl-1">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActive(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === active ? "w-8 bg-brand-500" : "w-3 bg-ink/15 hover:bg-ink/25"
                  }`}
                  aria-label={`${isEN ? "Step" : "Langkah"} ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* RIGHT: phone mockup */}
          <div className="flex justify-center">
            <PhoneMockup activeStep={active} isEN={isEN} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  PHONE MOCKUP SHELL                                                   */
/* ------------------------------------------------------------------ */

function PhoneMockup({ activeStep, isEN }: { activeStep: number; isEN: boolean }) {
  return (
    <div className="relative animate-phone-pulse" style={{ width: 260 }}>
      {/* expanding glow ring - single smooth pulse */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 rounded-[42px]"
        style={{
          "--ring-color":
            activeStep === 0
              ? "37,99,235"
              : activeStep === 1
              ? "139,92,246"
              : "16,185,129",
          animation: "ring-expand-color 3.2s ease-in-out infinite",
        } as React.CSSProperties}
        aria-hidden
      />
      {/* glow behind phone */}
      <div
        className="absolute inset-0 -z-10 scale-[0.85] rounded-[44px] opacity-30 blur-2xl transition-all duration-700"
        style={{
          background:
            activeStep === 0
              ? "radial-gradient(ellipse, #3b82f6 0%, transparent 70%)"
              : activeStep === 1
              ? "radial-gradient(ellipse, #8b5cf6 0%, transparent 70%)"
              : "radial-gradient(ellipse, #10b981 0%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* phone frame */}
      <div
        className="relative overflow-hidden rounded-[36px] border-[7px] border-ink/[0.12] bg-transparent shadow-[0_24px_64px_rgba(10,13,20,0.18),0_0_0_1px_rgba(10,13,20,0.06)]"
        style={{ backdropFilter: "blur(0px)" }}
      >
        {/* notch */}
        <div className="relative flex h-7 items-center justify-center bg-transparent">
          <div className="h-4 w-20 rounded-b-2xl bg-ink/[0.10]" />
        </div>

        {/* screen */}
        <div className="relative overflow-hidden bg-transparent" style={{ minHeight: 480 }}>
          {/* status bar */}
          <div className="flex items-center justify-between px-4 py-1.5">
            <span className="text-[9px] font-semibold text-ink/40">9:41</span>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-3.5 rounded-sm bg-ink/25" />
              <span className="h-1.5 w-1 rounded-sm bg-ink/25" />
            </div>
          </div>

          {/* content panel — animated on step change */}
          <div key={activeStep} className="animate-fade-in-up px-3 pb-5">
            <PhoneScreenContent step={activeStep} isEN={isEN} />
          </div>
        </div>

        {/* home indicator */}
        <div className="flex items-center justify-center bg-transparent py-2">
          <div className="h-1 w-20 rounded-full bg-ink/20" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PHONE SCREEN CONTENT per step                                        */
/* ------------------------------------------------------------------ */

function PhoneScreenContent({ step, isEN }: { step: number; isEN: boolean }) {
  if (step === 0) return <PhonePricingScreen isEN={isEN} />;
  if (step === 1) return <PhoneBuilderScreen isEN={isEN} />;
  return <PhoneShareScreen isEN={isEN} />;
}

function PhonePricingScreen({ isEN }: { isEN: boolean }) {
  return (
    <div className="space-y-2.5">
      <div className="px-1 pb-1">
        <div className="text-[11px] font-bold text-ink">{isEN ? "Pick a plan" : "Pilih paket"}</div>
        <div className="text-[9px] text-ink/40">{isEN ? "Start free, upgrade anytime" : "Mulai gratis, upgrade kapan saja"}</div>
      </div>

      {/* Free */}
      <div className="flex items-center gap-2.5 rounded-2xl border border-ink/10 bg-white/60 px-3 py-2.5 backdrop-blur-sm">
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-ink/6">
          <span className="h-2 w-2 rounded-full bg-ink/25" />
        </span>
        <div className="flex-1">
          <div className="text-[11px] font-semibold text-ink">Free</div>
          <div className="text-[9px] text-ink/40">5 link · 7 hari analytics</div>
        </div>
        <span className="text-[10px] font-bold text-ink/40">Rp0</span>
      </div>

      {/* Creator highlighted */}
      <div className="relative flex items-center gap-2.5 rounded-2xl border border-brand-300 bg-brand-50/80 px-3 py-2.5 shadow-[0_2px_12px_rgba(37,99,235,0.15)] backdrop-blur-sm">
        <span className="absolute -top-2 right-2.5 rounded-full bg-brand-500 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">
          {isEN ? "POPULAR" : "POPULER"}
        </span>
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-brand-500 shadow">
          <CheckCircle2 className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
        </span>
        <div className="flex-1">
          <div className="text-[11px] font-semibold text-brand-700">Creator</div>
          <div className="text-[9px] text-brand-400">{isEN ? "Unlimited links + analytics" : "Link tak terbatas + analytics"}</div>
        </div>
        <span className="text-[10px] font-bold text-brand-600">Rp25k</span>
      </div>

      <div className="rounded-2xl bg-ink px-3 py-2 text-center text-[10.5px] font-semibold text-white">
        {isEN ? "Start Free" : "Mulai Gratis"}
      </div>
    </div>
  );
}

function PhoneBuilderScreen({ isEN }: { isEN: boolean }) {
  return (
    <div className="space-y-2.5">
      <div className="px-1 pb-1">
        <div className="text-[11px] font-bold text-ink">{isEN ? "Your Portfolio" : "Portfolio kamu"}</div>
        <div className="text-[9px] text-ink/40">{isEN ? "Connect video platforms" : "Hubungkan platform video"}</div>
      </div>

      {/* URL bar */}
      <div className="flex items-center gap-2 rounded-2xl border border-ink/10 bg-white/60 px-3 py-2 backdrop-blur-sm">
        <Globe className="h-3 w-3 flex-shrink-0 text-brand-500" strokeWidth={2} />
        <span className="flex-1 text-[9.5px] text-ink/50">
          showreels.id/<span className="font-bold text-ink">{isEN ? "you" : "kamu"}</span>
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      </div>

      {/* platforms */}
      {[
        {
          label: "YouTube", connected: true,
          icon: (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="#FF0000">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          ),
        },
        {
          label: "TikTok", connected: true,
          icon: (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="#000000">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
            </svg>
          ),
        },
        {
          label: "Instagram", connected: false,
          icon: (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="url(#ig-grad)">
              <defs>
                <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f09433" />
                  <stop offset="25%" stopColor="#e6683c" />
                  <stop offset="50%" stopColor="#dc2743" />
                  <stop offset="75%" stopColor="#cc2366" />
                  <stop offset="100%" stopColor="#bc1888" />
                </linearGradient>
              </defs>
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
            </svg>
          ),
        },
        {
          label: "Vimeo", connected: false,
          icon: (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="#1AB7EA">
              <path d="M23.977 6.416c-.105 2.338-1.739 5.543-4.894 9.609-3.268 4.247-6.026 6.37-8.29 6.37-1.409 0-2.578-1.294-3.553-3.881L5.322 11.4C4.603 8.816 3.834 7.522 3.01 7.522c-.179 0-.806.378-1.881 1.132L0 7.197c1.185-1.044 2.351-2.084 3.501-3.128C5.08 2.701 6.266 1.984 7.055 1.91c1.867-.18 3.016 1.1 3.447 3.838.465 2.953.789 4.789.971 5.507.539 2.45 1.131 3.674 1.776 3.674.502 0 1.256-.796 2.265-2.385 1.004-1.589 1.54-2.797 1.612-3.628.144-1.371-.395-2.061-1.614-2.061-.574 0-1.167.121-1.777.391 1.186-3.868 3.434-5.757 6.762-5.637 2.473.06 3.628 1.664 3.48 4.807z" />
            </svg>
          ),
        },
      ].map((p) => (
        <div
          key={p.label}
          className="flex items-center gap-2.5 rounded-2xl border border-ink/8 bg-white/60 px-3 py-2 backdrop-blur-sm"
        >
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">{p.icon}</span>
          <span className="flex-1 text-[10.5px] font-semibold text-ink/70">{p.label}</span>
          {p.connected ? (
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" strokeWidth={2.5} />
          ) : (
            <span className="rounded-full border border-ink/10 px-1.5 py-0.5 text-[8px] font-semibold text-ink/30">{isEN ? "+ add" : "+ add"}</span>
          )}
        </div>
      ))}

      <div className="flex items-center justify-between rounded-2xl border border-ink/8 bg-white/60 px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <PlayCircle className="h-3.5 w-3.5 text-red-500" strokeWidth={2} />
          <span className="text-[10px] font-semibold text-ink">{isEN ? "12 videos connected" : "12 video terhubung"}</span>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[8.5px] font-semibold text-emerald-600">Live</span>
      </div>
    </div>
  );
}

function PhoneShareScreen({ isEN }: { isEN: boolean }) {
  return (
    <div className="space-y-2.5">
      <div className="px-1 pb-1">
        <div className="text-[11px] font-bold text-ink">{isEN ? "Public Profile" : "Profil publik"}</div>
        <div className="text-[9px] text-ink/40">showreels.id/{isEN ? "you" : "kamu"} · Live</div>
      </div>

      {/* mini profile card */}
      <div className="rounded-2xl border border-ink/10 bg-white/70 p-3 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-[11px] font-bold text-white">
            A
          </span>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[10.5px] font-semibold text-ink">showreels.id/{isEN ? "you" : "kamu"}</span>
              <CheckCircle2 className="h-3 w-3 text-brand-500" strokeWidth={3} />
            </div>
            <div className="text-[8.5px] text-ink/40">Videographer · Creator</div>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {["from-brand-300 to-brand-400", "from-violet-300 to-violet-400", "from-brand-200 to-brand-300"].map(
            (g, i) => (
              <div key={i} className={`relative aspect-video overflow-hidden rounded-lg bg-gradient-to-br ${g}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="h-2.5 w-2.5 text-white/80" fill="white" strokeWidth={0} />
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* share row */}
      <div className="grid grid-cols-2 gap-1.5">
        <button className="flex items-center gap-1.5 rounded-2xl border border-ink/10 bg-white/60 px-2.5 py-2 backdrop-blur-sm">
          <Copy className="h-3 w-3 text-ink/40" strokeWidth={2} />
          <span className="text-[9.5px] font-semibold text-ink/60">{isEN ? "Copy link" : "Salin link"}</span>
        </button>
        <button className="flex items-center gap-1.5 rounded-2xl bg-emerald-500 px-2.5 py-2">
          <svg className="h-3 w-3 flex-shrink-0 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M11.999 2C6.477 2 2 6.484 2 12.017c0 1.99.518 3.869 1.424 5.499L2 22l4.572-1.408A9.905 9.905 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2h-.001z" />
          </svg>
          <span className="text-[9.5px] font-semibold text-white">WhatsApp</span>
        </button>
      </div>

      {/* analytics mini */}
      <div className="grid grid-cols-3 gap-1.5">
        {[{ label: isEN ? "Views" : "Views", value: "1.2K" }, { label: isEN ? "Clicks" : "Klik", value: "348" }, { label: "CTR", value: "29%" }].map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-0.5 rounded-2xl border border-ink/8 bg-white/60 py-2 backdrop-blur-sm"
          >
            <span className="text-[12px] font-bold text-ink">{s.value}</span>
            <span className="text-[8px] font-medium text-ink/40">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
