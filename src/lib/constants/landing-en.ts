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

export const customerServiceEN = {
  eyebrow: "Help Center",
  headline: "We're here to help",
  headlineAccent: "you",
  headlineSuffix: " anytime.",
  subheadline:
    "Got issues with login, video submission, public profile, or billing? Our support team is ready to respond quickly and clearly.",
  hoursEyebrow: "SERVICE HOURS",
  hours: [
    {
      icon: "clock",
      label: "Operating Hours",
      value: "Monday – Friday",
      helper: "09.00 – 17.00 WIB",
    },
    {
      icon: "mail",
      label: "Email",
      value: "1×24h response",
      helper: "On business days",
    },
    {
      icon: "message",
      label: "WhatsApp",
      value: "Fast response",
      helper: "Mon – Fri, 09.00 – 17.00 WIB",
    },
  ],
  channelsEyebrow: "CONTACT US",
  channelsHeading: "Pick the",
  channelsHeadingAccent: "best",
  channelsHeadingSuffix: " way for you.",
  channelsSubhead:
    "Three official channels you can use — pick whichever feels most comfortable.",
  channels: [
    {
      title: "Email",
      value: "support@showreels.id",
      helper: "For detailed questions & attachments.",
      action: "Send email",
      href: "mailto:support@showreels.id",
      icon: "mail",
    },
    {
      title: "Phone",
      value: "+62 898-3704-013",
      helper: "Monday – Friday, 09.00 – 17.00 WIB.",
      action: "Call now",
      href: "tel:+628983704013",
      icon: "phone",
    },
    {
      title: "WhatsApp",
      value: "+62 898-3704-013",
      helper: "Fast response for early-stage consultations.",
      action: "Chat on WhatsApp",
      href: "https://wa.me/628983704013",
      icon: "message",
    },
  ],
  faqsEyebrow: "FAQ",
  faqsHeading: "Frequently",
  faqsHeadingAccent: "asked",
  faqsHeadingSuffix: " questions.",
  faqs: [
    {
      q: "How do I reset my account password?",
      a: "Open the Login page, click 'Forgot password', then enter your registered email. We'll send a reset link to your inbox within a few minutes.",
    },
    {
      q: "Why doesn't my video show on the public page?",
      a: "Make sure the video status is 'Published' in the dashboard and the platform link (YouTube, TikTok, etc) is still active. Try clearing your browser cache and reloading the page.",
    },
    {
      q: "How long does the video review take?",
      a: "For the free plan, review usually completes within 1×24 business hours. Creator and Pro plans get priority and are usually faster.",
    },
    {
      q: "How do I change my subscription plan?",
      a: "Go to Dashboard → Billing → Manage Plan. You can upgrade, downgrade, or cancel anytime. Changes are pro-rated automatically.",
    },
    {
      q: "Is my data safe?",
      a: "Yes. All data is encrypted with SSL end-to-end, and we never share personal information with third parties without your consent.",
    },
    {
      q: "Can I use a custom domain on showreels.id?",
      a: "Absolutely. Creator and Pro plans support custom domains. Reach out via email for DNS setup and domain verification guidance.",
    },
  ],
  ctaEyebrow: "NEED HELP RIGHT NOW?",
  ctaHeading: "Our team is",
  ctaHeadingAccent: "ready",
  ctaHeadingSuffix: " to listen.",
  ctaBody:
    "Head back to the dashboard to check your video status, or start fresh and build your professional portfolio link today.",
  ctaPrimaryLabel: "Open Dashboard",
  ctaPrimaryHref: "/dashboard",
  ctaSecondaryLabel: "Get Started Free",
  ctaSecondaryHref: "/auth/signup",
};
