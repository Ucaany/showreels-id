"use client";

import { LandingLangProvider } from "@/lib/i18n/landing-context";
import { Particles } from "@/components/ui/particles";
import { Header } from "@/components/header";
import Hero from "./Hero";
import BeforeAfterSection from "./BeforeAfterSection";
import FeatureSection from "./FeatureSection";
import HowItWorks from "./HowItWorks";
import StatsSection from "./StatsSection";
import TestimonialSection from "./TestimonialSection";
import PricingSection from "./PricingSection";
import TrustSection from "./TrustSection";
import FAQSection from "./FAQSection";
import CTABanner from "./CTABanner";
import Footer from "./Footer";

export default function LandingPageNew() {
  return (
    <LandingLangProvider>
      <main className="relative min-h-screen bg-white text-ink pt-[48px] md:pt-[80px] overflow-hidden">
        {/* Background particles + grid */}
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <Particles
            className="absolute inset-0"
            color="#2563eb"
            ease={20}
            quantity={60}
            size={0.3}
            staticity={80}
          />
          <div className="absolute inset-0 grid-bg opacity-40" />
        </div>

        {/* Content with z-index */}
        <div className="relative z-10">
          <Header />
          <Hero />
          <BeforeAfterSection />
          <FeatureSection />
          <HowItWorks />
          <StatsSection />
          <TestimonialSection />
          <PricingSection />
          <TrustSection />
          <FAQSection />
          <CTABanner />
          <Footer />
        </div>
      </main>
    </LandingLangProvider>
  );
}
