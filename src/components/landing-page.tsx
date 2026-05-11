"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { ArrowRight, BarChart3, Check, ChevronDown, ExternalLink, Globe, Link as LinkIcon, LogOut, Menu, Play, QrCode, Share2, Sparkles, UploadCloud, UserRound, Video, X } from "lucide-react";
import { SiFacebook, SiGoogledrive, SiInstagram, SiVimeo, SiYoutube } from "react-icons/si";
import { AppLogo } from "@/components/app-logo";
import { AvatarBadge } from "@/components/avatar-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePreferences } from "@/hooks/use-preferences";
import { cn } from "@/lib/cn";
import { signOut } from "next-auth/react";

type UsernameStatus = "idle" | "checking" | "invalid" | "available" | "taken";
type PricingPlanId = "free" | "creator" | "business";

const pricingHref: Record<PricingPlanId, string> = {
  free: "/payment?plan=free",
  creator: "/payment?plan=creator",
  business: "/payment?plan=business",
};

const navItems = [
  { href: "#features", key: "features", fallback: "Features" },
  { href: "#benefits", key: "benefits", fallback: "Benefits" },
  { href: "#pricing", key: "pricing", fallback: "Pricing" },
  { href: "#showcase", key: "showcase", fallback: "Showcase" },
  { href: "#faq", key: "faq", fallback: "FAQ" },
] as const;

const platformLogos = [
  { name: "YouTube", Icon: SiYoutube },
  { name: "Google Drive", Icon: SiGoogledrive },
  { name: "Instagram", Icon: SiInstagram },
  { name: "Vimeo", Icon: SiVimeo },
  { name: "Facebook", Icon: SiFacebook },
];

const featureIcons = [Video, UserRound, LinkIcon, BarChart3, UploadCloud, QrCode, Globe] as const;

function sanitizeUsernameInput(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "").slice(0, 24);
}

function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return (
    <m.div
      initial={reduced ? false : { opacity: 0, y: 22 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.45, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </m.div>
  );
}

function SectionIntro({ eyebrow, title, accent, description, centered = true }: { eyebrow: string; title: string; accent?: string; description: string; centered?: boolean }) {
  return (
    <div className={cn("max-w-3xl", centered && "mx-auto text-center")}>
      <p className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-neutral-600 shadow-sm">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-[clamp(2rem,4vw,2.875rem)] font-bold leading-[1.04] tracking-[-0.04em] text-neutral-950">
        {title} {accent ? <span className="text-neutral-500">{accent}</span> : null}
      </h2>
      <p className={cn("mt-4 text-[1.05rem] leading-8 text-neutral-600", centered && "mx-auto")}>{description}</p>
    </div>
  );
}

function PortfolioMockup({ avatarUrl, name }: { avatarUrl?: string | null; name: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[420px]">
      <div className="absolute -inset-8 rounded-[3rem] bg-gradient-to-br from-black/10 via-transparent to-black/5 blur-3xl" />
      <div className="relative overflow-hidden rounded-[2rem] border border-black/10 bg-white p-3 shadow-[0_30px_90px_rgba(0,0,0,0.14)]">
        <div className="rounded-[1.55rem] border border-neutral-200 bg-[#f5f5f5] p-4">
          <div className="flex items-center justify-between rounded-full border border-black/10 bg-white/80 px-3 py-2 backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
            </div>
            <span className="text-xs font-semibold text-neutral-500">showreels.id/{name.toLowerCase().split(" ")[0] || "creator"}</span>
          </div>
          <div className="mt-5 rounded-[1.5rem] bg-neutral-950 p-5 text-white">
            <div className="flex items-center gap-3">
              <AvatarBadge name={name} avatarUrl={avatarUrl || ""} size="lg" />
              <div>
                <p className="text-lg font-bold tracking-[-0.02em]">{name}</p>
                <p className="text-sm text-white/60">Video Editor • Creator Portfolio</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {["12 videos", "Public", "Available"].map((item) => (
                <div key={item} className="rounded-2xl bg-white/10 px-3 py-3 text-center text-xs font-semibold text-white/80">{item}</div>
              ))}
            </div>
          </div>
          <div className="mt-3 grid gap-3">
            {["Brand Film 2026", "Product Launch Reel", "Documentary Cut"].map((title, index) => (
              <div key={title} className="group flex items-center gap-3 rounded-[1.25rem] border border-neutral-200 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="relative aspect-video w-24 overflow-hidden rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-400">
                  <div className="absolute inset-0 grid place-items-center"><span className="grid h-9 w-9 place-items-center rounded-full bg-black text-white"><Play className="h-4 w-4 fill-white" /></span></div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-neutral-950">{title}</p>
                  <p className="text-xs text-neutral-500">Lazy thumbnail • {index === 0 ? "Featured" : "Published"}</p>
                </div>
                <ExternalLink className="h-4 w-4 text-neutral-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -left-8 top-20 hidden rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-xl lg:block">
        <p className="text-xs text-neutral-500">QR share</p><p className="font-bold">Ready</p>
      </div>
      <div className="absolute -right-8 bottom-24 hidden rounded-2xl border border-black/10 bg-white px-4 py-3 shadow-xl lg:block">
        <p className="text-xs text-neutral-500">Views</p><p className="font-bold">+38%</p>
      </div>
    </div>
  );
}

function FaqItem({ question, answer, open, onToggle }: { question: string; answer: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-neutral-200 last:border-b-0">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 py-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20">
        <span className="text-lg font-bold tracking-[-0.02em] text-neutral-950">{question}</span>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-neutral-200 bg-white text-neutral-500">{open ? <X className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
      </button>
      <AnimatePresence initial={false}>
        {open ? <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.24 }} className="overflow-hidden"><p className="max-w-2xl pb-6 leading-7 text-neutral-600">{answer}</p></m.div> : null}
      </AnimatePresence>
    </div>
  );
}

interface LandingPageProps {
  creatorCount: number;
  videoCount: number;
  featuredCreators: Array<{ id: string; name: string | null; username: string | null; image: string | null; bio: string | null; city: string | null; createdAt: Date }>;
  currentUser?: { name: string | null; username: string | null; image: string | null; email: string } | null;
}

export function LandingPage({ creatorCount, videoCount, featuredCreators, currentUser = null }: LandingPageProps) {
  const { dictionary, locale, setLocale } = usePreferences();
  const reduced = useReducedMotion();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameAsyncStatus, setUsernameAsyncStatus] = useState<Exclude<UsernameStatus, "invalid">>("idle");
  const [usernameSuggestion, setUsernameSuggestion] = useState("");
  const year = new Date().getFullYear();

  const loginLabel = dictionary.login?.trim() || (locale === "en" ? "Login" : "Masuk");
  const rawUsernameInput = usernameInput.trim();
  const sanitizedUsername = sanitizeUsernameInput(usernameInput);
  const isUsernameFormatValid = /^[a-zA-Z0-9_]{3,24}$/.test(rawUsernameInput);
  const usernameStatus: UsernameStatus = !rawUsernameInput ? "idle" : !isUsernameFormatValid ? "invalid" : usernameAsyncStatus;

  useEffect(() => {
    if (!isUsernameFormatValid) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/public/username-availability?username=${encodeURIComponent(rawUsernameInput)}`, { signal: controller.signal });
        const payload = (await response.json().catch(() => null)) as { reason?: UsernameStatus; available?: boolean; suggestion?: string } | null;
        if (!response.ok || !payload) { setUsernameAsyncStatus("idle"); setUsernameSuggestion(""); return; }
        if (payload.reason === "available") { setUsernameAsyncStatus("available"); setUsernameSuggestion(""); return; }
        if (payload.reason === "taken") { setUsernameAsyncStatus("taken"); setUsernameSuggestion(payload.suggestion || ""); return; }
        setUsernameAsyncStatus("idle"); setUsernameSuggestion(payload.suggestion || "");
      } catch { setUsernameAsyncStatus("idle"); setUsernameSuggestion(""); }
    }, 360);
    return () => { controller.abort(); window.clearTimeout(timeout); };
  }, [isUsernameFormatValid, rawUsernameInput]);

  const features = useMemo(() => [
    [locale === "en" ? "Video portfolio" : "Portfolio video", locale === "en" ? "Curate your best clips with clean previews and public video pages." : "Kurasi karya terbaik dengan preview bersih dan halaman video publik."],
    [locale === "en" ? "Public creator page" : "Halaman creator publik", locale === "en" ? "Profile, bio, avatar, contact, and skills in one premium page." : "Profil, bio, avatar, kontak, dan skill dalam satu halaman premium."],
    [locale === "en" ? "Social links" : "Social links", locale === "en" ? "Bring booking, media kit, WhatsApp, and socials into one share-ready link." : "Satukan booking, media kit, WhatsApp, dan sosial dalam satu link."],
    [locale === "en" ? "Analytics" : "Analytics", locale === "en" ? "Understand portfolio engagement without cluttering the experience." : "Pahami engagement portfolio tanpa membuat tampilan rumit."],
    [locale === "en" ? "Upload portfolio" : "Upload portfolio", locale === "en" ? "Add work from Drive, YouTube, Instagram, Vimeo, and Facebook." : "Tambah karya dari Drive, YouTube, Instagram, Vimeo, dan Facebook."],
    [locale === "en" ? "QR Share" : "QR Share", locale === "en" ? "Share your profile quickly for events, pitch decks, and client meetings." : "Bagikan profil cepat untuk event, pitch deck, dan meeting klien."],
    [locale === "en" ? "Multi-platform embed" : "Embed multi-platform", locale === "en" ? "Keep your existing video sources and present them beautifully." : "Tetap gunakan sumber video existing dan tampilkan dengan indah."],
  ], [locale]);

  const faqItems = useMemo(() => [
    [locale === "en" ? "Can I set my profile or videos to private?" : "Apakah profil atau video bisa dibuat private?", locale === "en" ? "Yes. Showreels supports draft, private, semi-private, and public visibility so you control each content." : "Bisa. Showreels mendukung draft, private, semi-private, dan public agar kamu mengontrol tiap konten."],
    [locale === "en" ? "Which video sources are supported?" : "Sumber video apa saja yang didukung?", locale === "en" ? "You can use YouTube, Google Drive, Instagram, Facebook, Vimeo, and uploaded portfolio assets." : "Kamu bisa memakai YouTube, Google Drive, Instagram, Facebook, Vimeo, dan aset portfolio upload."],
    [locale === "en" ? "Does this change my existing dashboard?" : "Apakah ini mengubah dashboard existing?", locale === "en" ? "No. The redesign only improves landing-page visuals and frontend UX while preserving existing logic." : "Tidak. Redesign hanya meningkatkan visual landing page dan UX frontend tanpa mengubah logic existing."],
    [locale === "en" ? "Can I share my creator page?" : "Bisakah halaman creator saya dibagikan?", locale === "en" ? "Yes. Public profile links, video pages, QR sharing, and social links remain available." : "Bisa. Link profil publik, halaman video, QR sharing, dan social links tetap tersedia."],
  ], [locale]);

  const statusLabel = usernameStatus === "checking" ? dictionary.landingHeroStatusChecking : usernameStatus === "available" ? dictionary.landingHeroStatusAvailable : usernameStatus === "taken" ? dictionary.landingHeroStatusTaken : usernameStatus === "invalid" ? dictionary.landingHeroStatusInvalid : dictionary.landingHeroStatusIdle;

  const heroName = featuredCreators[0]?.name || "Creator Demo";
  const statusTone = usernameStatus === "available" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : usernameStatus === "taken" || usernameStatus === "invalid" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-neutral-200 bg-white text-neutral-500";

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="min-h-screen overflow-x-clip bg-[#F5F5F5] text-[#111111] selection:bg-black selection:text-white">
        <header className="fixed inset-x-0 top-0 z-[70] px-3 pt-3 sm:px-6">
          <div className="mx-auto flex min-h-[64px] max-w-[1160px] items-center justify-between gap-3 rounded-full border border-black/10 bg-white/82 px-4 py-2 shadow-[0_16px_50px_rgba(0,0,0,0.08)] backdrop-blur-2xl">
            <AppLogo />
            <nav className="hidden items-center gap-1 rounded-full bg-neutral-100 p-1 text-sm font-semibold text-neutral-600 lg:flex" aria-label="Primary navigation">
              {navItems.map((item) => <a key={item.href} href={item.href} className="rounded-full px-4 py-2 transition hover:bg-white hover:text-neutral-950">{item.key === "features" ? dictionary.landingNavFeatures : item.key === "pricing" ? dictionary.landingNavPricing : item.key === "faq" ? dictionary.landingNavFaq : item.fallback}</a>)}
            </nav>
            <div className="hidden items-center gap-2 lg:flex">
              <button onClick={() => setLocale("id")} className={cn("rounded-full px-3 py-2 text-xs font-bold", locale === "id" ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-100")}>ID</button>
              <button onClick={() => setLocale("en")} className={cn("rounded-full px-3 py-2 text-xs font-bold", locale === "en" ? "bg-black text-white" : "text-neutral-500 hover:bg-neutral-100")}>EN</button>
              {currentUser ? <><Link href="/dashboard" className="rounded-full px-4 py-2 text-sm font-bold hover:bg-neutral-100">Dashboard</Link><AvatarBadge name={currentUser.name || "Creator"} avatarUrl={currentUser.image || ""} size="sm" /></> : <><Link href="/auth/login" className="rounded-full px-4 py-2 text-sm font-bold hover:bg-neutral-100">{loginLabel}</Link><Link href="/auth/signup"><Button className="rounded-full bg-black hover:bg-[#1A1A1A]">{dictionary.signup}<ArrowRight className="h-4 w-4" /></Button></Link></>}
            </div>
            <button type="button" onClick={() => setMobileMenuOpen(true)} className="grid h-11 w-11 place-items-center rounded-full border border-neutral-200 bg-white lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          </div>
        </header>

        <AnimatePresence>{mobileMenuOpen ? <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-sm lg:hidden"><button className="absolute inset-0" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" /><m.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.24 }} className="absolute right-0 top-0 h-full w-[min(88vw,380px)] bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><AppLogo /><button className="grid h-11 w-11 place-items-center rounded-full border" onClick={() => setMobileMenuOpen(false)}><X className="h-5 w-5" /></button></div><div className="mt-8 grid gap-2">{navItems.map((item) => <a key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className="rounded-2xl px-4 py-3 font-bold hover:bg-neutral-100">{item.key === "features" ? dictionary.landingNavFeatures : item.key === "pricing" ? dictionary.landingNavPricing : item.key === "faq" ? dictionary.landingNavFaq : item.fallback}</a>)}</div><div className="mt-8 flex gap-2"><button onClick={() => setLocale("id")} className="rounded-full border px-4 py-2 font-bold">ID</button><button onClick={() => setLocale("en")} className="rounded-full border px-4 py-2 font-bold">EN</button></div><div className="mt-8 grid gap-3">{currentUser ? <><Link href="/dashboard" className="rounded-full bg-black px-5 py-3 text-center font-bold text-white">Dashboard</Link><button onClick={async () => { await signOut({ redirect: false }); window.location.replace("/"); }} className="inline-flex items-center justify-center gap-2 rounded-full border px-5 py-3 font-bold"><LogOut className="h-4 w-4" /> Sign out</button></> : <><Link href="/auth/login" className="rounded-full border px-5 py-3 text-center font-bold">{loginLabel}</Link><Link href="/auth/signup" className="rounded-full bg-black px-5 py-3 text-center font-bold text-white">{dictionary.signup}</Link></>}</div></m.aside></m.div> : null}</AnimatePresence>

        <main>
          <section className="relative mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1160px] items-center gap-12 px-4 pb-20 pt-32 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pt-36">
            <div className="absolute inset-x-0 top-0 -z-10 h-[560px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,1),rgba(245,245,245,0))]" />
            <Reveal>
              <p className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-neutral-600 shadow-sm"><span className="h-2 w-2 rounded-full bg-black" />{dictionary.landingHeroBadge}</p>
              <h1 className="mt-5 max-w-3xl text-[clamp(42px,6vw,78px)] font-bold leading-none tracking-[-0.04em] text-neutral-950">{dictionary.landingHeroTitleLead}<br /><span className="text-neutral-500">{dictionary.landingHeroTitleAccent}</span></h1>
              <p className="mt-6 max-w-[38rem] text-lg leading-[1.7] text-neutral-600">{dictionary.landingHeroDescription}</p>
              <form className="mt-7 max-w-[34rem] rounded-[1.35rem] border border-black/10 bg-white p-1.5 shadow-[0_18px_60px_rgba(0,0,0,0.08)]" onSubmit={(e) => { e.preventDefault(); if (usernameStatus === "available") window.location.assign(`/auth/signup?username=${encodeURIComponent(sanitizedUsername)}`); }}>
                <div className="grid gap-2 min-[430px]:grid-cols-[1fr_auto]">
                  <label htmlFor="hero-username" className="flex min-w-0 items-center overflow-hidden rounded-[1rem] bg-neutral-100 px-3 text-sm font-bold text-neutral-700">showreels.id/<Input id="hero-username" value={usernameInput} onChange={(e) => { const next = e.target.value; const valid = /^[a-zA-Z0-9_]{3,24}$/.test(next.trim()); setUsernameInput(next); setUsernameSuggestion(""); setUsernameAsyncStatus(valid ? "checking" : "idle"); }} placeholder={dictionary.landingHeroInputPlaceholder} className="h-12 min-w-0 flex-1 border-0 bg-transparent px-1 shadow-none focus:ring-0" /></label>
                  <Button type="submit" disabled={usernameStatus !== "available"} className="h-12 rounded-full bg-black px-6 font-bold text-white hover:bg-[#1A1A1A]">{dictionary.landingHeroInputAction}<ArrowRight className="h-4 w-4" /></Button>
                </div>
              </form>
              <div className={cn("mt-3 inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold", statusTone)}><span className="h-2 w-2 rounded-full bg-current" />{statusLabel}{usernameStatus === "taken" && usernameSuggestion ? ` (${locale === "en" ? "Try" : "Coba"} @${usernameSuggestion})` : ""}</div>
              <div className="mt-7 flex flex-wrap items-center gap-3 text-sm font-semibold text-neutral-600"><div className="flex -space-x-2">{featuredCreators.slice(0, 4).map((c) => <AvatarBadge key={c.id} name={c.name || "Creator"} avatarUrl={c.image || ""} size="sm" />)}</div><span>{creatorCount.toLocaleString(locale === "en" ? "en-US" : "id-ID")} creators</span><span className="h-1 w-1 rounded-full bg-neutral-300" /><span>{videoCount.toLocaleString(locale === "en" ? "en-US" : "id-ID")} videos</span></div>
            </Reveal>
            <m.div animate={reduced ? undefined : { y: [0, -10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}><PortfolioMockup avatarUrl={featuredCreators[0]?.image} name={heroName} /></m.div>
          </section>

          <section className="border-y border-black/10 bg-white py-7" aria-label="Trusted platforms"><div className="mx-auto flex max-w-[1160px] flex-wrap items-center justify-center gap-3 px-4 sm:px-6 lg:px-8"><span className="mr-2 text-sm font-bold text-neutral-500">Trusted workflow:</span>{platformLogos.map(({ name, Icon }) => <div key={name} className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-[#F5F5F5] px-4 py-2 text-sm font-bold text-neutral-700"><Icon className="h-4 w-4" />{name}</div>)}</div></section>

          <section id="features" className="mx-auto max-w-[1160px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-[120px]"><SectionIntro eyebrow={dictionary.landingFeaturesBadge} title={dictionary.landingFeaturesTitleLead} accent={dictionary.landingFeaturesTitleAccent} description={dictionary.landingFeaturesDescription} /><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{features.map(([title, description], index) => { const Icon = featureIcons[index] || Sparkles; return <Reveal key={title} delay={index * 0.03} className={cn("group rounded-[28px] border border-black/10 bg-white p-6 shadow-[0_14px_44px_rgba(0,0,0,0.05)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(0,0,0,0.09)]", index === 0 && "lg:col-span-2 lg:row-span-2", index === 6 && "md:col-span-2")}><div className="grid h-12 w-12 place-items-center rounded-2xl bg-neutral-950 text-white"><Icon className="h-5 w-5" /></div><h3 className="mt-5 text-xl font-bold tracking-[-0.03em]">{title}</h3><p className="mt-3 leading-7 text-neutral-600">{description}</p>{index === 0 ? <div className="mt-6 overflow-hidden rounded-2xl bg-neutral-100 p-3"><div className="aspect-video rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-400 grid place-items-center"><Play className="h-8 w-8 fill-black" /></div></div> : null}</Reveal>; })}</div></section>

          <section id="benefits" className="bg-white py-16 sm:py-24 lg:py-[120px]"><div className="mx-auto grid max-w-[1160px] gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8"><SectionIntro centered={false} eyebrow="Benefits" title={locale === "en" ? "A portfolio that feels premium before clients press play." : "Portfolio yang terasa premium sebelum klien menekan play."} description={locale === "en" ? "Clean whitespace, modern hierarchy, fast loading, and strong CTAs help visitors understand your creative value faster." : "Whitespace bersih, hierarchy modern, loading cepat, dan CTA kuat membantu visitor memahami value kreatifmu lebih cepat."} /><div className="grid gap-3">{["Clear creator identity", "Fast public sharing", "No visual clutter", "Mobile-first conversion"].map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-[#F5F5F5] p-4 font-bold"><Check className="h-5 w-5" />{item}</div>)}</div></div></section>

          <section id="showcase" className="mx-auto max-w-[1160px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-[120px]"><SectionIntro eyebrow="Showcase" title={locale === "en" ? "Creator pages and video cards" : "Halaman creator dan video cards"} accent={locale === "en" ? "without flicker." : "tanpa flicker."} description={locale === "en" ? "Preview cards use stable dimensions, optimized lazy rendering, and clean thumbnails to prevent blank states." : "Preview card memakai dimensi stabil, lazy rendering optimal, dan thumbnail bersih untuk mencegah blank state."} /><div className="mt-10 grid gap-4 md:grid-cols-3">{[0,1,2].map((i) => <Reveal key={i} delay={i * 0.06} className="overflow-hidden rounded-[28px] border border-black/10 bg-white p-3 shadow-[0_18px_55px_rgba(0,0,0,0.06)]"><div className="aspect-[4/5] rounded-[1.35rem] bg-gradient-to-br from-neutral-100 via-white to-neutral-300 p-4"><div className="flex items-center gap-3"><AvatarBadge name={featuredCreators[i]?.name || `Creator ${i+1}`} avatarUrl={featuredCreators[i]?.image || ""} /><div><p className="font-bold">{featuredCreators[i]?.name || `Creator ${i+1}`}</p><p className="text-sm text-neutral-500">@{featuredCreators[i]?.username || "showreels"}</p></div></div><div className="mt-5 aspect-video rounded-2xl bg-neutral-950 grid place-items-center text-white"><Play className="h-7 w-7 fill-white" /></div><div className="mt-4 space-y-2"><div className="h-3 rounded bg-white/80"/><div className="h-3 w-2/3 rounded bg-white/80"/></div></div></Reveal>)}</div></section>

          <section className="bg-white py-16 sm:py-24 lg:py-[120px]"><div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8"><SectionIntro eyebrow={dictionary.landingHowItWorksBadge} title={dictionary.landingHowItWorksTitleLead} accent={dictionary.landingHowItWorksTitleAccent} description={dictionary.landingHowItWorksDescription} /><div className="mt-10 grid gap-4 lg:grid-cols-3">{[[dictionary.landingHowItWorksStep1Label,dictionary.landingHowItWorksStep1Title,dictionary.landingHowItWorksStep1Description,UserRound],[dictionary.landingHowItWorksStep2Label,dictionary.landingHowItWorksStep2Title,dictionary.landingHowItWorksStep2Description,UploadCloud],[dictionary.landingHowItWorksStep3Label,dictionary.landingHowItWorksStep3Title,dictionary.landingHowItWorksStep3Description,Share2]].map(([label,title,desc,Icon], i) => { const StepIcon = Icon as typeof UserRound; return <Reveal key={String(label)} delay={i*0.06} className="relative rounded-[28px] border border-black/10 bg-[#F5F5F5] p-7"><span className="rounded-full bg-black px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">{String(label)}</span><StepIcon className="mt-8 h-9 w-9" /><h3 className="mt-5 text-2xl font-bold tracking-[-0.04em]">{String(title)}</h3><p className="mt-3 leading-7 text-neutral-600">{String(desc)}</p></Reveal>; })}</div></div></section>

          <section id="pricing" className="mx-auto max-w-[1160px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-[120px]"><SectionIntro eyebrow={dictionary.landingPricingBadge} title={dictionary.landingPricingTitleLead} accent={dictionary.landingPricingTitleAccent} description={dictionary.landingPricingDescription} /><div className="mt-10 grid gap-4 lg:grid-cols-3">{([{id:"free",name:"Free",price:"Rp0",copy:dictionary.landingPricingFree},{id:"creator",name:"Pro",price:"Rp25.000",copy:dictionary.landingPricingCreator,featured:true},{id:"business",name:"Unlimited",price:"Rp49.000",copy:dictionary.landingPricingTeam}] as Array<{id:PricingPlanId;name:string;price:string;copy:string;featured?:boolean}>).map((plan) => <Link key={plan.id} href={pricingHref[plan.id]} className={cn("rounded-[28px] border p-7 transition hover:-translate-y-1", plan.featured ? "border-black bg-black text-white shadow-[0_28px_80px_rgba(0,0,0,0.22)]" : "border-black/10 bg-white shadow-[0_18px_55px_rgba(0,0,0,0.05)]")}><p className={cn("text-sm font-bold uppercase tracking-widest", plan.featured ? "text-white/60" : "text-neutral-500")}>{plan.name}</p><p className="mt-5 text-4xl font-bold tracking-[-0.05em]">{plan.price}<span className={cn("text-sm font-semibold", plan.featured ? "text-white/60" : "text-neutral-500")}>/bulan</span></p><p className={cn("mt-4 leading-7", plan.featured ? "text-white/75" : "text-neutral-600")}>{plan.copy}</p><span className={cn("mt-7 inline-flex rounded-full px-5 py-3 font-bold", plan.featured ? "bg-white text-black" : "bg-black text-white")}>{locale === "en" ? "Choose plan" : "Pilih paket"}</span></Link>)}</div></section>

          <section className="bg-white py-16 sm:py-24 lg:py-[120px]"><div className="mx-auto max-w-[1160px] px-4 sm:px-6 lg:px-8"><SectionIntro eyebrow={dictionary.landingTestimonialsBadge} title={dictionary.landingTestimonialsTitleLead} accent={dictionary.landingTestimonialsTitleAccent} description={dictionary.landingTestimonialsDescription} /><div className="mt-10 grid gap-4 lg:grid-cols-3">{["Nadia Putri","Dio Pratama","Raka Maulana"].map((name, i) => <article key={name} className={cn("rounded-[28px] border p-6", i===1 ? "border-black bg-black text-white" : "border-black/10 bg-[#F5F5F5]")}><p className="text-lg leading-8">“{locale === "en" ? "Showreels makes my portfolio feel sharper, faster, and easier to send to brands." : "Showreels membuat portfolio saya terlihat lebih rapi, cepat, dan mudah dikirim ke brand."}”</p><div className="mt-6 flex items-center gap-3"><AvatarBadge name={name} avatarUrl="" /><div><p className="font-bold">{name}</p><p className={cn("text-sm", i===1 ? "text-white/60" : "text-neutral-500")}>Creator</p></div></div></article>)}</div></div></section>

          <section id="faq" className="mx-auto max-w-[900px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-[120px]"><SectionIntro eyebrow={dictionary.landingFaqBadge} title={dictionary.landingFaqTitleLead} accent={dictionary.landingFaqTitleAccent} description={dictionary.landingFaqDescription} /><div className="mt-10 rounded-[28px] border border-black/10 bg-white px-5 shadow-[0_18px_55px_rgba(0,0,0,0.05)] sm:px-8">{faqItems.map(([question, answer], index) => <FaqItem key={question} question={question} answer={answer} open={openFaqIndex === index} onToggle={() => setOpenFaqIndex((prev) => prev === index ? -1 : index)} />)}</div></section>

          <section className="mx-auto max-w-[1160px] px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8"><div className="relative overflow-hidden rounded-[2.25rem] bg-black px-6 py-16 text-center text-white shadow-[0_30px_100px_rgba(0,0,0,0.22)] sm:px-10 lg:py-24"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent_45%)]" /><div className="relative mx-auto max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">{dictionary.landingFinalBadge}</p><h2 className="mt-5 text-[clamp(2.25rem,5vw,4.75rem)] font-bold leading-none tracking-[-0.05em]">Build your creator portfolio now.</h2><p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/70">{dictionary.landingFinalDescription}</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/auth/signup"><Button className="h-13 rounded-full bg-white px-7 font-bold text-black hover:bg-neutral-100">{dictionary.landingFinalPrimaryCta}<ArrowRight className="h-4 w-4" /></Button></Link><Link href="/videos"><Button variant="secondary" className="h-13 rounded-full border-white/20 bg-white/10 px-7 font-bold text-white hover:bg-white/15">{dictionary.landingFinalSecondaryCta}</Button></Link></div></div></div></section>
        </main>

        <footer className="border-t border-black/10 bg-white"><div className="mx-auto grid max-w-[1160px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr] lg:px-8"><div><AppLogo /><p className="mt-4 max-w-sm leading-7 text-neutral-600">showreels.id membantu creator menampilkan karya terbaik dengan halaman publik yang cepat, rapi, dan profesional.</p></div>{[["Product",[["Features","#features"],["Pricing","#pricing"],["Showcase","#showcase"]]],["Social",[["Explore","/videos"],["Creator Register","/auth/signup"],["Login","/auth/login"]]],["Legal",[["Legal","/legal"],["Privacy","/legal/privasi"],["Contact","/customer-service"]]]].map(([title, links]) => <div key={String(title)}><p className="font-bold">{String(title)}</p><div className="mt-3 grid gap-2 text-neutral-600">{(links as string[][]).map(([label,href]) => <Link key={label} href={href} className="hover:text-black">{label}</Link>)}</div></div>)}</div><div className="border-t border-black/10"><div className="mx-auto flex max-w-[1160px] flex-col justify-between gap-2 px-4 py-5 text-sm text-neutral-500 sm:flex-row sm:px-6 lg:px-8"><p>Copyright {year} showreels.id. All rights reserved.</p><p>Creator-first platform</p></div></div></footer>
      </div>
    </LazyMotion>
  );
}
