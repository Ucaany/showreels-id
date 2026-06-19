import type { PricingPlan } from "@/lib/constants/landing";

export const navItemsEN = [
  { href: "#home", label: "Home" },
  { href: "#fitur", label: "Features" },
  { href: "#harga", label: "Pricing" },
  { href: "#testimoni", label: "Testimonials" },
  { href: "#faq", label: "FAQ" },
];

export const faqsEN = [
  {
    q: "What is showreels.id?",
    a: "A video portfolio platform that brings together your work from YouTube, TikTok, Instagram, Vimeo, and more into a single shareable link.",
  },
  {
    q: "Is it free forever?",
    a: "Yes, the Starter plan is free forever. Upgrade anytime for advanced features.",
  },
  {
    q: "Is there a watermark?",
    a: "No watermark on any plan, including the free Starter plan.",
  },
  {
    q: "Can I use a custom domain?",
    a: "Absolutely. The Creator and Pro plans support your own custom domain.",
  },
  {
    q: "How do I share it?",
    a: "Just copy your unique link and share it on your Instagram bio, TikTok, or any platform.",
  },
  {
    q: "Where can I see an example?",
    a: "Check a username in the hero section to see a live public portfolio example.",
  },
];

export const pricingPlansEN: PricingPlan[] = [
  {
    name: "Basic",
    tagline: "Perfect for new users who want to try the core features.",
    price: 0,
    priceLabel: "Rp0",
    period: "/month",
    cta: "Start Free",
    featured: false,
    features: [
      { text: "Up to 5 links", status: "limited" },
      { text: "7-day analytics", status: "limited" },
      { text: "10 videos / platform", status: "limited" },
      { text: "Custom Thumbnail", status: "not_included" },
      { text: "Blue Badge", status: "not_included" },
      { text: "Creator Group", status: "not_included" },
      { text: "Whitelabel", status: "not_included" },
      { text: "Theme Switch", status: "not_included" },
      { text: "Standard support", status: "included" },
    ],
  },
  {
    name: "Creator",
    tagline: "More control and capacity for active creators.",
    price: 25000,
    priceLabel: "Rp25.000",
    period: "/month",
    cta: "Choose Creator",
    featured: true,
    badge: "Popular",
    features: [
      { text: "Unlimited Link Builder", status: "included" },
      { text: "30-day analytics", status: "limited" },
      { text: "50 videos / platform", status: "limited" },
      { text: "Custom Thumbnail", status: "included" },
      { text: "Blue Badge (active while plan runs)", status: "included" },
      { text: "Creator Group", status: "included" },
      { text: "Whitelabel", status: "included" },
      { text: "Theme Switch", status: "coming_soon" },
      { text: "Priority support", status: "included" },
    ],
  },
];

export const statsEN = [
  { value: 12, suffix: "K+", label: "Registered creators" },
  { value: 250, suffix: "K+", label: "Videos connected" },
  { value: 98, suffix: "%", label: "Uptime guaranteed" },
  { value: 5, suffix: "★", label: "User rating" },
];

export const heroEN = {
  eyebrow: "Video Portfolio Platform",
  headline: "Your video portfolio,",
  headlineAccent: "one link.",
  subheadline:
    "Connect YouTube, TikTok, Instagram, Vimeo, and more into one professional portfolio page — share it anywhere.",
  ctaPrimary: "Get Started Free",
  ctaSecondary: "See example",
  usernameLabel: "Your username",
  usernameCta: "Claim your link",
  usernameHint: "showreels.id/your-username",
};

export const featureSectionEN = {
  eyebrow: "CORE FEATURES",
  headline: "Simple tools for a",
  headlineAccent: "professional",
  headlineSuffix: "portfolio.",
};

export const howItWorksEN = {
  eyebrow: "HOW IT WORKS",
  headline: "Fast &",
  headlineAccent: "Easy",
  subheadline: "Start using Showreels in 3 simple, fast steps.",
  steps: [
    {
      id: "pricing",
      step: "01",
      label: "Pick a Plan",
      heading: "Start free, upgrade anytime",
      body: "No credit card required. Choose the Free plan or go straight to Creator for full features.",
      result: { label: "Account active in", value: "< 1 min" },
    },
    {
      id: "builder",
      step: "02",
      label: "Add Videos",
      heading: "Custom username, all platforms",
      body: "Register your unique username and connect YouTube, TikTok, Instagram, Vimeo in one click.",
      result: { label: "Link ready at", value: "showreels.id/you" },
    },
    {
      id: "share",
      step: "03",
      label: "Publish & Share",
      heading: "One link, all platforms",
      body: "Share to Instagram bio, TikTok, LinkedIn, or WhatsApp. Track views and clicks in real time.",
      result: { label: "Average first click within", value: "24 hours" },
    },
  ],
  nextStep: "Next step",
  readyCta: "Ready? Start now",
};

export const statsSectionEN = {
  eyebrow: "",
};

export const testimonialSectionEN = {
  eyebrow: "TESTIMONIALS",
  headline: "Used by creators who",
  headlineAccent: "seriously",
  headlineSuffix: "create.",
  quotes: [
    "Portfolio so much cleaner. Clients click straight from Instagram.",
    "Clean, simple, and looks professional without complex setup.",
    "All videos from different platforms in one link. Game changer.",
    "Just share one link in my Instagram bio and viewers explore from there.",
    "Now clients see all my showreels without me sending them one by one.",
    "Professional-looking in just a few minutes. Love it.",
  ],
};

export const pricingSectionEN = {
  eyebrow: "Pricing",
  headline: "Plans for",
  headlineAccent: "your needs",
  subheadline:
    "We design pricing to fit your creative workflow.",
  monthly: "Monthly",
  quarterly: "3 Months",
};

export const faqSectionEN = {
  eyebrow: "FAQ",
  headline: "Frequently asked",
  headlineAccent: "questions",
  headlineSuffix: ".",
};

export const ctaBannerEN = {
  headline: "Ready to look",
  headlineAccent: "professional",
  headlineSuffix: "with one link?",
  benefits: [
    { label: "Setup < 2 minutes" },
    { label: "No credit card" },
    { label: "Fully customizable" },
  ],
  ctaPrimary: "Start Free",
  ctaSecondary: "Login",
};

export const footerEN = {
  tagline: "Video portfolio platform connecting your work from every platform in one page.",
  copyright: "© 2025 showreels.id. All rights reserved.",
  status: "All systems operational",
  columns: {
    product: { heading: "Product", items: ["Features", "Pricing", "Changelog", "Roadmap"] },
    company: { heading: "Company", items: ["About", "Blog", "Careers", "Press"] },
    help: { heading: "Help", items: ["Docs", "FAQ", "Contact", "Status"] },
    legal: { heading: "Legal", items: ["Privacy", "Terms", "Cookies", "DPA"] },
  },
};
