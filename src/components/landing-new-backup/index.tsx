import Header from "./Header";
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
    <main className="relative min-h-screen bg-white text-ink pt-[64px]">
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
    </main>
  );
}
