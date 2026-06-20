"use client";

import { Mail, MessageCircleMore, PhoneCall, Clock, ArrowUpRight } from "lucide-react";
import { customerService } from "@/lib/constants/landing";
import { customerServiceEN } from "@/lib/constants/landing-en";
import { useLang } from "@/lib/i18n/landing-context";
import CSFAQSection from "./CSFAQSection";

const iconMap = {
  mail: Mail,
  phone: PhoneCall,
  message: MessageCircleMore,
  clock: Clock,
} as const;

type CSText = typeof customerService | typeof customerServiceEN;
type ChannelItem = (typeof customerService)["channels"][number];
type HoursItem = (typeof customerService)["hours"][number];

function HeroSection({ t }: { t: CSText }) {
  return (
    <section className="relative overflow-hidden pt-16 pb-10 md:pt-20 md:pb-12">
      <div className="absolute inset-0 -z-10 grid-bg-soft" aria-hidden />
      <div
        className="glow-blob h-[420px] w-[420px] bg-brand-500/[0.07] left-[2%] top-0 animate-blob"
        aria-hidden
      />
      <div
        className="glow-blob h-[340px] w-[340px] bg-brand-600/[0.05] right-[3%] top-24 animate-blob"
        aria-hidden
      />

      <div className="container mx-auto max-w-[860px] px-6 text-center">
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700 shadow-soft">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-500" />
            {t.eyebrow}
          </span>
        </div>

        <h1 className="mx-auto mt-6 max-w-[760px] text-center text-hero-display font-semibold text-ink [animation-delay:60ms] animate-reveal">
          {t.headline}{" "}
          <span className="font-accent text-accent">{t.headlineAccent}</span>
          {" "}
          {t.headlineSuffix}
        </h1>

        <p className="mx-auto mt-5 max-w-[640px] text-body-lg text-ink/60 [animation-delay:120ms] animate-reveal">
          {t.subheadline}
        </p>
      </div>
    </section>
  );
}

function HoursSection({ t }: { t: CSText }) {
  return (
    <section className="relative -mt-2 bg-white pb-2 pt-2 md:-mt-4 md:pb-4 md:pt-3">
      <div className="container mx-auto max-w-[1180px] px-6">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="flex items-center gap-3 text-ink/35">
            <span className="h-px w-10 bg-current" />
            <span className="rounded-full border border-brand-100 bg-white px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-700">
              {t.hoursEyebrow}
            </span>
            <span className="h-px w-10 bg-current" />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {t.hours.map((item: HoursItem) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            return (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-white px-5 py-4 shadow-soft"
              >
                <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  {Icon ? <Icon className="h-4 w-4" strokeWidth={2.4} /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink/40">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-[13.5px] font-semibold text-ink">{item.value}</p>
                  <p className="text-[11.5px] text-ink/55">{item.helper}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ChannelsSection({ t }: { t: CSText }) {
  return (
    <section className="relative py-12 md:py-16">
      <div className="absolute inset-0 -z-10 grid-bg-soft" aria-hidden />
      <div
        className="glow-blob h-72 w-72 bg-brand-500/[0.06] right-[4%] top-20 animate-blob"
        aria-hidden
      />

      <div className="container mx-auto max-w-[1180px] px-6">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-3 flex items-center gap-3 text-ink/35">
            <span className="h-px w-10 bg-current" />
            <span className="rounded-full border border-brand-100 bg-white px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-700">
              {t.channelsEyebrow}
            </span>
            <span className="h-px w-10 bg-current" />
          </div>
          <h2 className="text-section-display font-semibold text-ink">
            {t.channelsHeading}{" "}
            <span className="font-accent text-accent">{t.channelsHeadingAccent}</span>
            {" "}
            {t.channelsHeadingSuffix}
          </h2>
          <p className="mt-3 max-w-[520px] text-body-base text-ink/60">
            {t.channelsSubhead}
          </p>
        </div>

        {/* List-style channels (no cards) */}
        <div className="mx-auto max-w-[860px] divide-y divide-[color:var(--border)] border-y border-[color:var(--border)]">
          {t.channels.map((c: ChannelItem) => {
            const Icon = iconMap[c.icon as keyof typeof iconMap];
            return (
              <div
                key={c.title}
                className="group flex flex-col items-start gap-5 py-7 md:flex-row md:items-center md:gap-7"
              >
                <span className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-all group-hover:bg-brand-100">
                  {Icon ? <Icon className="h-5 w-5" strokeWidth={2.2} /> : null}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink/40">
                    {c.title}
                  </p>
                  <p className="mt-1 text-[18px] font-semibold tracking-[-0.01em] text-ink">
                    {c.value}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink/55">
                    {c.helper}
                  </p>
                </div>

                <a
                  href={c.href}
                  target={c.href.startsWith("http") ? "_blank" : undefined}
                  rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="inline-flex h-10 items-center gap-1.5 self-start rounded-full border border-brand-200/70 bg-white/55 px-5 text-[12.5px] font-semibold shadow-[0_8px_22px_rgba(29,78,216,0.12)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/75 md:self-auto"
                  style={{ color: "#1e40af" }}
                >
                  {c.action}
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    strokeWidth={2.4}
                  />
                </a>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BottomCTASection({ t }: { t: CSText }) {
  return (
    <section id="cta" className="relative py-12 md:py-16">
      <div className="container mx-auto max-w-[1180px] px-6">
        <div className="relative overflow-hidden rounded-3xl border border-[color:var(--border)] bg-white px-6 py-12 shadow-card md:px-14 md:py-14">
          <div
            className="glow-blob h-64 w-64 bg-brand-500/[0.06] right-[-40px] top-[-40px] animate-blob"
            aria-hidden
          />
          <div
            className="glow-blob h-56 w-56 bg-brand-600/[0.05] left-[-40px] bottom-[-40px] animate-blob"
            aria-hidden
          />

          <div className="relative flex flex-col items-center text-center">
            <span className="rounded-full border border-brand-100 bg-brand-50/40 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-700">
              {t.ctaEyebrow}
            </span>
            <h2 className="mt-4 text-section-display font-semibold text-ink">
              {t.ctaHeading}{" "}
              <span className="font-accent text-accent">{t.ctaHeadingAccent}</span>
              {" "}
              {t.ctaHeadingSuffix}
            </h2>
            <p className="mt-4 max-w-[560px] text-body-base text-ink/60">{t.ctaBody}</p>

            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={t.ctaPrimaryHref}
                className="group inline-flex h-12 w-full sm:w-auto items-center justify-center gap-1.5 rounded-full border border-brand-200/70 bg-white/55 px-7 text-[13.5px] font-semibold shadow-[0_10px_28px_rgba(29,78,216,0.14)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/75"
                style={{ color: "#1e40af" }}
              >
                {t.ctaPrimaryLabel}
              </a>
              <a
                href={t.ctaSecondaryHref}
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-full border border-brand-200/70 bg-white/55 px-7 text-[13.5px] font-semibold shadow-[0_10px_28px_rgba(29,78,216,0.10)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white/75"
                style={{ color: "#1e40af" }}
              >
                {t.ctaSecondaryLabel}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CustomerServiceBody() {
  const { lang } = useLang();
  const t = lang === "EN" ? customerServiceEN : customerService;
  return (
    <>
      <HeroSection t={t} />
      <HoursSection t={t} />
      <ChannelsSection t={t} />
      <CSFAQSection />
      <BottomCTASection t={t} />
    </>
  );
}
