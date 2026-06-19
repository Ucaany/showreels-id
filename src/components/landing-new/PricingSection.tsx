"use client";

import { useState } from "react";
import { pricingPlans } from "@/lib/constants/landing";
import { pricingPlansEN, pricingSectionEN } from "@/lib/constants/landing-en";
import { useLang } from "@/lib/i18n/landing-context";
import PricingCard from "./PricingCard";

type BillingCycle = "monthly" | "quarterly";

export default function PricingSection() {
  const { lang } = useLang();
  const isEN = lang === "EN";
  const plans = isEN ? pricingPlansEN : pricingPlans;
  const [cycle, setCycle] = useState<BillingCycle>("quarterly");

  return (
    <section
      id="harga"
      className="relative overflow-hidden bg-white pt-14 pb-8 text-black md:pt-24 md:pb-12"
    >

      <div className="container mx-auto max-w-[1180px] px-6">
        <div className="mx-auto mb-8 flex max-w-[720px] flex-col items-center text-center">
          <div className="mb-3 flex items-center gap-3 text-ink/30">
            <span className="h-px w-10 bg-current" />
            <span className="rounded-full border border-brand-100 bg-white px-3 py-1 font-sans text-[10.5px] font-semibold uppercase tracking-[0.18em] text-brand-700">
              {isEN ? pricingSectionEN.eyebrow : "Pricing"}
            </span>
            <span className="h-px w-10 bg-current" />
          </div>

          <h2 className="text-section-display font-semibold text-ink">
            {isEN ? (
              <>
                {pricingSectionEN.headline}{" "}
                <span className="font-accent text-brand-600">{pricingSectionEN.headlineAccent}</span>
              </>
            ) : (
              <>
                Plans untuk{" "}
                <span className="font-accent text-brand-600">kebutuhanmu</span>
              </>
            )}
          </h2>
          <p className="mt-3 text-body-base font-normal text-ink/60">
            {isEN
              ? pricingSectionEN.subheadline
              : "Kami analisis kebutuhan bisnismu, dan bikin harga yang pas untuk kamu."}
          </p>

          <div
            role="tablist"
            aria-label="Billing cycle"
            className="mt-5 inline-flex h-10 items-center gap-1 rounded-full border border-ink/15 bg-transparent p-1"
          >
            <button
              role="tab"
              aria-selected={cycle === "monthly"}
              onClick={() => setCycle("monthly")}
              className={`inline-flex h-8 items-center justify-center rounded-full px-5 font-sans text-[12.5px] font-semibold transition-colors ${
                cycle === "monthly"
                  ? "text-ink"
                  : "text-ink/45 hover:text-ink/80"
              }`}
            >
              {isEN ? pricingSectionEN.monthly : "Monthly"}
            </button>
            <button
              role="tab"
              aria-selected={cycle === "quarterly"}
              onClick={() => setCycle("quarterly")}
              className={`inline-flex h-8 items-center gap-2 rounded-full pl-4 pr-3 font-sans text-[12.5px] font-semibold transition-colors ${
                cycle === "quarterly"
                  ? "text-ink"
                  : "text-ink/45 hover:text-ink/80"
              }`}
            >
              {isEN ? pricingSectionEN.quarterly : "3 Months"}
              <span className="inline-flex items-center rounded-full bg-black/[0.06] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink/70">
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="mx-auto mt-8 grid max-w-[760px] items-stretch justify-center gap-4 md:mt-10 md:grid-cols-2">
          {plans.map((plan) => (
            <PricingCard key={plan.name} plan={plan} cycle={cycle} />
          ))}
        </div>
      </div>
    </section>
  );
}
