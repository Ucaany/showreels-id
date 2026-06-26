"use client";

import FeatureCard from "./FeatureCard";
import { featureCards } from "@/lib/constants/landing";
import { featureCardsEN, featureSectionEN } from "@/lib/constants/landing-en";
import { useLang } from "@/lib/i18n/landing-context";

export default function FeatureSection() {
  const { lang } = useLang();
  const isEN = lang === "EN";
  const cards = isEN ? featureCardsEN : featureCards;

  return (
    <section id="fitur" className="relative py-14 md:py-16">
      <div className="absolute inset-0 -z-10 grid-bg-soft" aria-hidden />
      <div
        className="glow-blob h-72 w-72 bg-brand-500/8 right-[4%] top-24 animate-blob"
        aria-hidden
      />

      <div className="container mx-auto max-w-[1180px] px-6">
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-3 text-ink/35">
            <span className="h-px w-10 bg-current" />
            <span className="rounded-full border border-brand-100 bg-white px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-700">
              {isEN ? featureSectionEN.eyebrow : "FITUR UTAMA"}
            </span>
            <span className="h-px w-10 bg-current" />
          </div>
          <h2 className="text-section-display font-semibold text-ink">
            {isEN ? (
              <>
                {featureSectionEN.headline}{" "}
                <span className="font-accent text-accent">{featureSectionEN.headlineAccent}</span>{" "}
                {featureSectionEN.headlineSuffix}
              </>
            ) : (
              <>
                Tools sederhana untuk{" "}
                <span className="font-accent text-accent">portofolio</span>{" "}
                profesional.
              </>
            )}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-6">
          {cards.map((f) => (
            <div
              key={f.title}
              className={
                f.size === "tall"
                  ? "md:col-span-2"
                  : f.size === "wide"
                    ? "md:col-span-3"
                    : "md:col-span-2"
              }
            >
              <FeatureCard
                feature={f}
                size={f.size === "tall" ? "tall" : "default"}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}