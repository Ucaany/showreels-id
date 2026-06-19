"use client";

import Link from "next/link";
import { ArrowRight, CreditCard, Sparkles, Clock, LogIn } from "lucide-react";

const benefits = [
  { icon: Clock, label: "Setup < 2 menit" },
  { icon: CreditCard, label: "Tanpa kartu kredit" },
  { icon: Sparkles, label: "Full customize" },
];

export default function CTABanner() {
  return (
    <section id="cta" className="relative py-12 md:py-16">
      <div className="container mx-auto max-w-[1180px] px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-card">
          {/* Looping video background */}
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          >
            <source src="/hero-loop.mp4" type="video/mp4" />
          </video>

          {/* Lighter gradient overlay so the looping video is visible while text stays readable */}
          <div
            className="absolute inset-0 bg-[linear-gradient(140deg,rgba(8,12,22,0.52)_0%,rgba(10,16,28,0.35)_45%,rgba(8,12,22,0.52)_100%)]"
            aria-hidden
          />

          {/* Subtle inner highlight + vignette to lift the text */}
          <div
            className="absolute inset-0 opacity-80"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(255,255,255,0.06), transparent 70%)",
            }}
            aria-hidden
          />

          <div className="relative px-6 py-12 text-center md:px-14 md:py-16">
            <h2
              className="text-section-display font-semibold text-white"
              style={{ textShadow: "0 2px 18px rgba(0,0,0,0.45)" }}
            >
              Siap tampil{" "}
              <span className="font-accent text-accent">profesional</span>{" "}
              dengan satu link?
            </h2>

            {/* Benefits with icons */}
            <ul className="mx-auto mt-6 flex max-w-[680px] flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] font-medium text-white/80">
              {benefits.map((b, i) => {
                const Icon = b.icon;
                return (
                  <li
                    key={b.label}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Icon
                      className="h-3.5 w-3.5 text-accent"
                      strokeWidth={2.4}
                    />
                    <span>{b.label}</span>
                    {i < benefits.length - 1 && (
                      <span
                        className="ml-6 hidden h-1 w-1 rounded-full bg-white/30 sm:inline-block"
                        aria-hidden
                      />
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="#username"
                className="group relative inline-flex h-12 w-full sm:w-auto items-center justify-center gap-1.5 rounded-full bg-white px-7 text-[13.5px] font-semibold text-ink shadow-[0_10px_28px_rgba(0,0,0,0.35),0_6px_18px_rgba(0,0,0,0.25)] transition-all hover:-translate-y-0.5 hover:bg-white/95"
              >
                Mulai Gratis
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2.6}
                />
              </Link>
              <Link
                href="/auth/login"
                className="group inline-flex h-12 w-full sm:w-auto items-center justify-center gap-1.5 rounded-full border border-white/25 bg-white/5 px-7 text-[13.5px] font-semibold text-white backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/10 hover:text-white"
                style={{ color: "#ffffff" }}
              >
                <span style={{ color: "#ffffff" }}>Login</span>
                <LogIn
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2.4}
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
