"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import type { IconType } from "react-icons";
import { SiFacebook, SiGoogledrive, SiInstagram, SiVimeo, SiYoutube } from "react-icons/si";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Globe,
  HardDrive,
  Link as LinkIcon,
  Lock,
  LogOut,
  Menu,
  Play,
  PlayCircle,
  Plus,
  Star,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { AvatarBadge } from "@/components/avatar-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePreferences } from "@/hooks/use-preferences";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";

const THEME_PREVIEWS = [
  { name: "Creator Clean", handle: "@creator.clean", bg: "from-slate-50 to-slate-200", textTone: "dark" as const },
  { name: "Portfolio Warm", handle: "@creator.warm", bg: "from-white to-slate-100", textTone: "dark" as const },
  { name: "Studio Focus", handle: "@creator.studio", bg: "from-slate-200 to-slate-400", textTone: "dark" as const },
  { name: "Editorial Soft", handle: "@creator.editorial", bg: "from-slate-100 to-slate-200", textTone: "dark" as const },
  { name: "Minimal Dark", handle: "@creator.minimal", bg: "from-zinc-800 to-zinc-950", textTone: "light" as const },
];

const PLATFORM_SOURCES = [
  { name: "Google Drive", helper: "Drive", icon: SiGoogledrive },
  { name: "YouTube", helper: "YouTube", icon: SiYoutube },
  { name: "Instagram", helper: "Instagram", icon: SiInstagram },
  { name: "Vimeo", helper: "Vimeo", icon: SiVimeo },
  { name: "Facebook", helper: "Facebook", icon: SiFacebook },
] as const;

const PREVIEW_PLATFORM_ROWS = [
  { label: "Google Drive", icon: SiGoogledrive },
  { label: "YouTube", icon: SiYoutube },
  { label: "Instagram", icon: SiInstagram },
  { label: "Vimeo", icon: SiVimeo },
  { label: "Facebook", icon: SiFacebook },
] as const;

type UsernameStatus = "idle" | "checking" | "invalid" | "available" | "taken";
type PricingPlanId = "free" | "creator" | "business";

const PRICING_PLAN_HREF_BY_ID: Record<PricingPlanId, string> = {
  free: "/payment?plan=free",
  creator: "/payment?plan=creator",
  business: "/payment?plan=business",
};

function sanitizeUsernameInput(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "").slice(0, 24);
}

function createSeededHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getThemeAvatarLetter(value: string) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letters[createSeededHash(value) % letters.length] || "S";
}

function SectionHeading({ badge, lead, accent, description, centered = true }: { badge: string; lead: string; accent?: string; description?: string; centered?: boolean }) {
  return (
    <div className={cn(centered ? "mx-auto text-center" : "", "max-w-3xl")}>
      <Badge className="uppercase tracking-[0.18em]">{badge}</Badge>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
        {lead} {accent ? <span className="font-accent text-slate-700">{accent}</span> : null}
      </h2>
      {description ? <p className="mt-4 text-base leading-relaxed text-slate-500 sm:text-lg">{description}</p> : null}
    </div>
  );
}

type PreviewPhoneCardRow = { label: string; icon: IconType; status?: string };

function PhonePreviewMockup({
  className,
  gradientClassName,
  name,
  handle,
  avatarUrl,
  avatarText,
  rows,
  footer,
  backgroundVideoSrc,
  avatarSize = "md",
  textTone = "dark",
  compact = false,
  compactHeight = false,
}: {
  className?: string;
  gradientClassName: string;
  name: string;
  handle: string;
  avatarUrl: string;
  avatarText?: string;
  rows: PreviewPhoneCardRow[];
  footer?: string;
  backgroundVideoSrc?: string;
  avatarSize?: "sm" | "md" | "lg";
  textTone?: "dark" | "light";
  compact?: boolean;
  compactHeight?: boolean;
}) {
  const isLightTone = textTone === "light";
  const hasAvatarImage = avatarUrl.trim().length > 0;

  return (
    <div
      className={cn(
        compact ? "aspect-[9/16.35] rounded-[2.05rem]" : compactHeight ? "aspect-[9/15.75] rounded-[2.28rem]" : "aspect-[9/17.15] rounded-[2.28rem]",
        "border-[2.5px] border-zinc-900/50 bg-zinc-950 p-[2px] shadow-sm shadow-slate-900/10 ring-1 ring-slate-200",
        className
      )}
    >
      <div className={cn("relative flex h-full flex-col overflow-hidden bg-gradient-to-b px-3 pb-3.5 pt-3 sm:px-3.5", compact ? "rounded-[1.82rem]" : "rounded-[2.02rem]", gradientClassName)}>
        {backgroundVideoSrc ? (
          <>
            <video className="absolute inset-0 h-full w-full object-cover opacity-45 grayscale" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
              <source src={backgroundVideoSrc} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-zinc-950/70" />
          </>
        ) : null}
        <div className="relative z-10 mx-auto h-2.5 w-16 rounded-full bg-zinc-950" />
        <div className={cn("relative z-10 mx-auto w-fit rounded-full border-2 border-white/70 bg-white", compact ? "mt-2 p-1" : "mt-3 p-1.5")}>
          {avatarText ? (
            <span className={cn("inline-flex items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700", compact ? "h-10 w-10 text-sm" : "h-14 w-14 text-lg")}>{avatarText}</span>
          ) : !hasAvatarImage ? (
            <span className={cn("inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-700", compact ? "h-10 w-10" : "h-14 w-14")}><UserRound className={cn(compact ? "h-5 w-5" : "h-7 w-7")} /></span>
          ) : (
            <AvatarBadge name={name} avatarUrl={avatarUrl} size={avatarSize} />
          )}
        </div>
        <p className={cn("relative z-10 mt-2.5 text-center font-semibold tracking-tight", compact ? "text-base" : "text-xl", isLightTone ? "text-white" : "text-slate-950")}>{name}</p>
        <p className={cn("relative z-10 text-center", compact ? "text-xs" : "text-sm", isLightTone ? "text-zinc-300" : "text-slate-500")}>@{handle}</p>
        <div className={cn("relative z-10 shrink-0", compact ? "mt-2 space-y-1.5" : "mt-3 space-y-2")}>
          {rows.map((row) => {
            const RowIcon = row.icon;
            return (
              <div key={`${row.label}-${row.status || "row"}`} className={cn("flex items-center justify-between rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm shadow-slate-900/5", compact ? "min-h-8 px-2 py-1.5" : "min-h-[2.6rem] px-3 py-2")}>
                <span className={cn("inline-flex min-w-0 items-center gap-2 font-medium", compact ? "text-xs" : "text-sm")}>
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700"><RowIcon className="h-3 w-3" /></span>
                  <span className="truncate">{row.label}</span>
                </span>
                {row.status ? <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-600">{row.status}</span> : null}
              </div>
            );
          })}
        </div>
        {footer ? <p className={cn("relative z-10 mt-auto pt-3 text-center text-[0.69rem] font-medium tracking-[0.08em]", isLightTone ? "text-zinc-300" : "text-slate-500")}>{footer}</p> : null}
      </div>
    </div>
  );
}

function LandingFaqItem({ question, answer, open, onToggle }: { question: string; answer: string; open: boolean; onToggle: () => void }) {
  return (
    <m.article layout className="border-b border-slate-200 last:border-b-0">
      <button type="button" onClick={onToggle} className={cn("flex w-full items-center justify-between gap-4 py-5 text-left sm:py-6", open && "bg-slate-50/60")}>
        <span className="max-w-[90%] text-base font-semibold text-slate-950 sm:text-lg">{question}</span>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">{open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</span>
      </button>
      <AnimatePresence initial={false}>{open ? <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden"><p className="max-w-3xl pb-6 text-sm leading-relaxed text-slate-500 sm:text-base">{answer}</p></m.div> : null}</AnimatePresence>
    </m.article>
  );
}

interface LandingPageProps {
  creatorCount: number;
  videoCount: number;
  featuredCreators: Array<{ id: string; name: string | null; username: string | null; image: string | null; bio: string; city: string; createdAt: Date }>;
  currentUser?: { name: string | null; username: string | null; image: string | null; email: string } | null;
}

export function LandingPage({ creatorCount, videoCount, featuredCreators, currentUser = null }: LandingPageProps) {
  const { dictionary, locale, setLocale } = usePreferences();
  const prefersReducedMotion = useReducedMotion();
  const year = new Date().getFullYear();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameAsyncStatus, setUsernameAsyncStatus] = useState<Exclude<UsernameStatus, "invalid">>("idle");
  const [usernameSuggestion, setUsernameSuggestion] = useState("");

  const loginLabel = dictionary.login?.trim() || (locale === "en" ? "Login" : "Masuk");
  const sanitizedUsername = useMemo(() => sanitizeUsernameInput(usernameInput), [usernameInput]);
  const rawUsernameInput = usernameInput.trim();
  const isUsernameFormatValid = /^[a-zA-Z0-9_]{3,24}$/.test(rawUsernameInput);
  const usernameStatus: UsernameStatus = !rawUsernameInput ? "idle" : !isUsernameFormatValid ? "invalid" : usernameAsyncStatus;

  useEffect(() => {
    if (!isUsernameFormatValid) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/public/username-availability?username=${encodeURIComponent(rawUsernameInput)}`, { signal: controller.signal });
        const payload = (await response.json().catch(() => null)) as { reason?: UsernameStatus; available?: boolean; suggestion?: string } | null;
        if (!response.ok || !payload) return setUsernameAsyncStatus("idle");
        if (payload.reason === "available") { setUsernameAsyncStatus("available"); setUsernameSuggestion(""); return; }
        if (payload.reason === "taken") { setUsernameAsyncStatus("taken"); setUsernameSuggestion(payload.suggestion || ""); return; }
        setUsernameAsyncStatus("idle");
        setUsernameSuggestion(payload.suggestion || "");
      } catch { setUsernameAsyncStatus("idle"); setUsernameSuggestion(""); }
    }, 360);
    return () => { controller.abort(); window.clearTimeout(timeout); };
  }, [isUsernameFormatValid, rawUsernameInput]);

  const marketingTestimonials = useMemo(() => [
    { quote: locale === "en" ? "Clients now open my showreels page to check profile, skills, and videos in one flow. It saves review time." : "Sekarang klien cukup buka showreels page saya untuk lihat profil, skills, dan video dalam satu alur. Review jadi lebih cepat.", name: "Nadia Putri", role: "Freelance Video Editor", light: true, rating: 5 },
    { quote: locale === "en" ? "Semi-private visibility helps me send selected cuts to brands before public release, while keeping the same profile." : "Mode semi-private membantu saya kirim cut tertentu ke brand sebelum public, tanpa bikin profil baru.", name: "Dio Pratama", role: locale === "en" ? "Content Creator" : "Kreator Konten", light: false, rating: 4 },
    { quote: locale === "en" ? "Custom links and contact links make media kit, WhatsApp, and booking access clearer for collaborators." : "Custom links dan contact links bikin akses ke media kit, WhatsApp, dan booking jadi jauh lebih jelas.", name: "Raka Maulana", role: locale === "en" ? "Videographer" : "Videografer", light: true, rating: 5 },
  ], [locale]);

  const marketingFaqItems = useMemo(() => [
    { question: locale === "en" ? "Can I set my profile or videos to private?" : "Apakah profil atau video bisa dibuat private?", answer: locale === "en" ? "Yes. Showreels supports draft, private, semi_private, and public states so you can control who sees each content." : "Bisa. Showreels mendukung status draft, private, semi_private, dan public agar kamu bisa kontrol siapa yang melihat konten." },
    { question: locale === "en" ? "Does each video have its own public page?" : "Apakah setiap video punya halaman publik sendiri?", answer: locale === "en" ? "Yes. Each published video gets a public slug page and can be shared directly." : "Ya. Setiap video yang dipublikasikan punya halaman slug publik dan bisa dibagikan langsung." },
    { question: locale === "en" ? "Which video sources are supported?" : "Sumber video apa saja yang didukung?", answer: locale === "en" ? "You can submit videos from YouTube, Google Drive, Instagram, Facebook, and Vimeo." : "Kamu bisa submit video dari YouTube, Google Drive, Instagram, Facebook, dan Vimeo." },
    { question: locale === "en" ? "Can I add custom links and social/contact links?" : "Bisakah menambah custom link dan social/contact links?", answer: locale === "en" ? "Yes. You can arrange priority custom links and social/contact links from your creator dashboard." : "Bisa. Kamu dapat mengatur custom link prioritas dan social/contact links langsung dari dashboard creator." },
    { question: locale === "en" ? "What is the difference between draft, private, semi_private, and public?" : "Apa beda draft, private, semi_private, dan public?", answer: locale === "en" ? "Draft is for editing, private is hidden, semi_private is shared to selected audience, and public is visible to everyone." : "Draft untuk proses edit, private tersembunyi, semi_private dibagikan terbatas, dan public terlihat oleh semua orang." },
  ], [locale]);

  const previewPlatformRows = useMemo(() => PREVIEW_PLATFORM_ROWS.map((item, index) => ({ ...item, status: locale === "en" ? ["active", "ready", "shown", "open", "live"][index] : ["aktif", "siap", "tampil", "buka", "live"][index] })), [locale]);
  const themeFeatureRows = useMemo(() => [
    { label: dictionary.landingThemesFeatureCustomLinks, icon: SiGoogledrive },
    { label: dictionary.landingThemesFeatureSocialLinks, icon: SiYoutube },
    { label: dictionary.landingThemesFeatureVideoHighlight, icon: SiInstagram },
    { label: dictionary.landingThemesFeatureContact, icon: SiVimeo },
  ], [dictionary.landingThemesFeatureContact, dictionary.landingThemesFeatureCustomLinks, dictionary.landingThemesFeatureSocialLinks, dictionary.landingThemesFeatureVideoHighlight]);

  const pricingPlans = useMemo(() => [
    { id: "free" as PricingPlanId, name: "Free", monthlyPrice: "Rp0", subtitle: dictionary.landingPricingFree, featured: false },
    { id: "creator" as PricingPlanId, name: "Creator", monthlyPrice: "Rp25.000", subtitle: dictionary.landingPricingCreator, featured: true },
    { id: "business" as PricingPlanId, name: "Business", monthlyPrice: "Rp49.000", subtitle: dictionary.landingPricingTeam, featured: false },
  ], [dictionary.landingPricingCreator, dictionary.landingPricingFree, dictionary.landingPricingTeam]);

  const statusLabel = usernameStatus === "checking" ? dictionary.landingHeroStatusChecking : usernameStatus === "available" ? dictionary.landingHeroStatusAvailable : usernameStatus === "taken" ? dictionary.landingHeroStatusTaken : usernameStatus === "invalid" ? dictionary.landingHeroStatusInvalid : dictionary.landingHeroStatusIdle;
  const statusToneClass = usernameStatus === "available" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : usernameStatus === "taken" || usernameStatus === "invalid" ? "border-rose-100 bg-rose-50 text-rose-700" : usernameStatus === "checking" ? "border-amber-100 bg-amber-50 text-amber-700" : "border-slate-200 bg-white text-slate-500";
  const statusDotClass = usernameStatus === "available" ? "bg-emerald-500" : usernameStatus === "taken" || usernameStatus === "invalid" ? "bg-rose-500" : usernameStatus === "checking" ? "bg-amber-500" : "bg-slate-400";

  const navLinks = [
    { href: "#features", label: dictionary.landingNavFeatures },
    { href: "#themes", label: dictionary.landingNavThemes },
    { href: "#pricing", label: dictionary.landingNavPricing },
    { href: "#faq", label: dictionary.landingNavFaq },
  ];

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="min-h-screen overflow-x-clip bg-slate-50 text-slate-950">
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
          <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <AppLogo />
            <div className="hidden items-center gap-6 text-sm font-medium lg:flex">
              {navLinks.map((link) => <a key={link.href} href={link.href} className="text-slate-500 transition hover:text-slate-950">{link.label}</a>)}
            </div>
            <div className="hidden items-center gap-2 lg:flex">
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium text-slate-500">
                {(["id", "en"] as const).map((item) => <button key={item} type="button" onClick={() => setLocale(item)} className={cn("rounded-full px-2.5 py-1 transition", locale === item ? "bg-zinc-900 text-white" : "hover:text-slate-950")}>{item.toUpperCase()}</button>)}
              </div>
              {currentUser ? <>
                <Link href="/dashboard"><Button variant="secondary" size="sm">Dashboard</Button></Link>
                <button type="button" className="inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-950" onClick={async () => { const supabase = createClient(); await supabase?.auth.signOut(); window.location.replace("/"); }}><LogOut className="h-4 w-4" />Sign out</button>
              </> : <>
                <Link href="/auth/login"><Button variant="ghost" size="sm">{loginLabel}</Button></Link>
                <Link href="/auth/signup"><Button variant="secondary" size="sm">{dictionary.signup}</Button></Link>
              </>}
            </div>
            <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden" onClick={() => setMobileMenuOpen((prev) => !prev)} aria-label="Open menu" aria-expanded={mobileMenuOpen}>{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </nav>
        </header>

        {mobileMenuOpen ? <div className="fixed inset-0 z-[80] bg-slate-950/30 lg:hidden"><button type="button" className="absolute inset-0 h-full w-full cursor-default" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu backdrop" /><aside className="absolute right-0 top-0 h-full w-[min(88vw,360px)] border-l border-slate-200 bg-white p-5 shadow-sm"><div className="mb-6 flex items-center justify-between"><AppLogo /><button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700" onClick={() => setMobileMenuOpen(false)}><X className="h-5 w-5" /></button></div><div className="space-y-2 pb-6">{navLinks.map((link) => <a key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-950">{link.label}</a>)}</div><div className="border-t border-slate-200 pt-5"><div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium text-slate-500">{(["id", "en"] as const).map((item) => <button key={item} type="button" onClick={() => setLocale(item)} className={cn("rounded-full px-2.5 py-1", locale === item ? "bg-zinc-900 text-white" : "")}>{item.toUpperCase()}</button>)}</div><div className="mt-5 flex flex-col gap-2">{currentUser ? <><Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}><Button variant="secondary" className="w-full">Dashboard</Button></Link><Button variant="ghost" className="w-full" onClick={async () => { const supabase = createClient(); await supabase?.auth.signOut(); window.location.replace("/"); }}><LogOut className="h-4 w-4" />Sign out</Button></> : <><Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}><Button variant="secondary" className="w-full">{loginLabel}</Button></Link><Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}><Button className="w-full">{dictionary.signup}</Button></Link></>}</div></div></aside></div> : null}

        <main className="overflow-x-clip">
          <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-12 lg:px-8 lg:py-20">
            <div className="mx-auto max-w-2xl text-center lg:col-span-7 lg:mx-0 lg:text-left">
              <Badge className="uppercase tracking-[0.18em]">{dictionary.landingHeroBadge}</Badge>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">{dictionary.landingHeroTitleLead}<span className="mt-1 block font-accent text-slate-700">{dictionary.landingHeroTitleAccent}</span></h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg lg:mx-0">{dictionary.landingHeroDescription}</p>
              <form className="mx-auto mt-6 w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-1 shadow-sm shadow-slate-900/5 lg:mx-0" onSubmit={(event) => { event.preventDefault(); if (usernameStatus === "available") window.location.assign(`/auth/signup?username=${encodeURIComponent(sanitizedUsername)}`); }}>
                <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="flex min-w-0 items-center gap-1 rounded-xl bg-white px-3"><label htmlFor="hero-username" className="shrink-0 text-sm font-medium text-slate-900">showreels.id/</label><Input id="hero-username" value={usernameInput} onChange={(event) => { const nextValue = event.target.value; const valid = /^[a-zA-Z0-9_]{3,24}$/.test(nextValue.trim()); setUsernameInput(nextValue); setUsernameSuggestion(""); setUsernameAsyncStatus(valid ? "checking" : "idle"); }} placeholder={dictionary.landingHeroInputPlaceholder} className="h-11 min-w-0 flex-1 border-none bg-transparent px-0 text-sm font-medium text-slate-950 shadow-none placeholder:text-slate-400 focus:ring-0" /></div>
                  <Button type="submit" className="h-11 w-full sm:w-auto" disabled={usernameStatus !== "available"}>{dictionary.landingHeroInputAction}<ArrowRight className="h-4 w-4" /></Button>
                </div>
              </form>
              <div className={cn("mx-auto mt-3 inline-flex max-w-full items-center gap-2 overflow-hidden rounded-full border px-3 py-1 text-sm font-medium lg:mx-0", statusToneClass)}><span className={cn("h-2 w-2 rounded-full", statusDotClass)} /><span className="truncate">{statusLabel}{usernameStatus === "taken" && usernameSuggestion ? ` (${locale === "en" ? "Try" : "Coba"} @${usernameSuggestion})` : ""}</span></div>
              <div className="mx-auto mt-6 flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-medium text-slate-500 lg:mx-0 lg:justify-start"><div className="flex -space-x-2.5">{featuredCreators.slice(0, 4).map((creator) => <AvatarBadge key={creator.id} name={creator.name || "Creator"} avatarUrl={creator.image || ""} size="sm" />)}</div><p>{creatorCount.toLocaleString(locale === "en" ? "en-US" : "id-ID")} {locale === "en" ? "creators are active today" : "creator aktif hari ini"}</p><span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-flex" /><p>{videoCount.toLocaleString(locale === "en" ? "en-US" : "id-ID")} {locale === "en" ? "videos published" : "video dipublish"}</p></div>
            </div>
            <m.div className="relative mx-auto w-full max-w-[360px] lg:col-span-5" animate={prefersReducedMotion ? undefined : { y: [0, -10, 0] }} transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut" }}><PhonePreviewMockup className="mx-auto w-full max-w-[336px]" gradientClassName="from-zinc-900 to-zinc-950" name={featuredCreators[0]?.name || "Creator Demo"} handle={featuredCreators[0]?.username || "creator.demo"} avatarUrl={featuredCreators[0]?.image || ""} rows={previewPlatformRows} footer="showreels.id/creator.demo" backgroundVideoSrc={prefersReducedMotion ? undefined : "/hero-loop.mp4"} avatarSize="lg" textTone="light" compactHeight /></m.div>
          </section>

          <section id="features" className="border-y border-slate-200 bg-slate-50 py-12 sm:py-16 lg:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading badge={dictionary.landingFeaturesBadge} lead={dictionary.landingFeaturesTitleLead} accent={dictionary.landingFeaturesTitleAccent} description={dictionary.landingFeaturesDescription} /><div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <m.article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/5" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}><div className="h-24 bg-gradient-to-br from-slate-200 to-slate-300" /><div className="relative p-5"><div className="absolute -top-8 left-5 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-slate-100"><UserRound className="h-8 w-8 text-slate-500" /></div><div className="mt-9"><h3 className="text-lg font-semibold text-slate-950">Alex Johnson</h3><p className="mt-2 text-sm leading-relaxed text-slate-500">Professional video editor specializing in documentaries and commercials.</p></div><div className="mt-4 flex flex-wrap gap-1.5">{["Premiere Pro", "Color Grading", "Motion", "Sound"].map((skill) => <span key={skill} className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{skill}</span>)}</div><Button className="mt-5 h-9 px-3 text-xs">Contact Me</Button></div></m.article>
            <m.article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}><div className="mb-4 flex items-center gap-2"><span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700"><LinkIcon className="h-4 w-4" /></span><h3 className="font-semibold text-slate-950">Import dari Mana Saja</h3></div><div className="grid grid-cols-3 gap-2">{[{ Icon: SiYoutube, name: "YouTube" }, { Icon: SiGoogledrive, name: "Drive" }, { Icon: SiInstagram, name: "Instagram" }, { Icon: SiFacebook, name: "Facebook" }, { Icon: SiVimeo, name: "Vimeo" }, { Icon: HardDrive, name: "Others" }].map((platform) => <div key={platform.name} className="flex aspect-square items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700"><platform.Icon className="h-5 w-5" /></div>)}</div></m.article>
            <m.article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}><div className="mb-4 flex items-center gap-2"><span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700"><Eye className="h-4 w-4" /></span><h3 className="font-semibold text-slate-950">Kontrol Visibilitas</h3></div><div className="space-y-2">{[{ label: "Draft", icon: null, active: false }, { label: "Private", icon: Lock, active: false }, { label: "Semi-Private", icon: EyeOff, active: false }, { label: "Public", icon: Globe, active: true }].map((status) => <div key={status.label} className={cn("flex items-center gap-2 rounded-xl border px-3 py-2", status.active ? "border-zinc-900 bg-slate-50" : "border-slate-200")}><span className={cn("h-3 w-3 rounded-full", status.active ? "bg-zinc-900" : "bg-slate-300")} /><p className="flex-1 text-sm font-medium text-slate-800">{status.label}</p>{status.icon ? <status.icon className="h-4 w-4 text-slate-400" /> : null}</div>)}</div></m.article>
            <m.article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 md:col-span-2 lg:col-span-1" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}><h3 className="font-semibold text-slate-950">Halaman Publik per Slug</h3><p className="mt-2 text-sm leading-relaxed text-slate-500">Sajikan karyamu dengan profesional untuk dinilai klien.</p><div className="mt-4 overflow-hidden rounded-xl border border-slate-200"><div className="flex items-center gap-2 bg-slate-100 p-2"><div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-slate-300" /><span className="h-2.5 w-2.5 rounded-full bg-slate-300" /><span className="h-2.5 w-2.5 rounded-full bg-slate-300" /></div><div className="flex-1 rounded bg-white px-3 py-1.5 text-xs text-slate-500">showreels.id/v/documentary-film</div></div><div className="relative aspect-video bg-gradient-to-br from-slate-200 to-slate-300"><div className="absolute inset-0 flex items-center justify-center"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-900"><Play className="ml-0.5 h-5 w-5 text-white" fill="white" /></span></div></div></div></m.article>
          </div></div></section>

          <section className="bg-white py-12 sm:py-16 lg:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading badge={dictionary.landingPlatformBadge} lead={dictionary.landingPlatformTitleLead} accent={dictionary.landingPlatformTitleAccent} description={dictionary.landingPlatformDescription} /><div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">{PLATFORM_SOURCES.map((platform) => { const PlatformIcon = platform.icon; return <m.article key={platform.name} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm shadow-slate-900/5" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-700"><PlatformIcon className="h-7 w-7" /></div><h3 className="mt-4 text-sm font-semibold text-slate-950">{platform.name}</h3><Badge variant="positive" className="mt-3">{locale === "en" ? "Supported" : "Didukung"}</Badge></m.article>; })}</div></div></section>

          <section className="bg-slate-50 py-12 sm:py-16 lg:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading badge={dictionary.landingHowItWorksBadge} lead={locale === "en" ? "Start in 3 steps" : "Mulai dalam 3 langkah"} description={dictionary.landingHowItWorksDescription} /><div className="mt-10 grid gap-4 md:grid-cols-3">{[{ title: dictionary.landingHowItWorksStep1Title, description: dictionary.landingHowItWorksStep1Description, icon: UserRound }, { title: dictionary.landingHowItWorksStep2Title, description: dictionary.landingHowItWorksStep2Description, icon: Upload }, { title: dictionary.landingHowItWorksStep3Title, description: dictionary.landingHowItWorksStep3Description, icon: Check }].map((step, index) => { const StepIcon = step.icon; return <m.article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}><div className="flex items-center justify-between"><span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold", index === 0 ? "bg-zinc-900 text-white" : "border border-slate-200 bg-white text-slate-500")}>{index + 1}</span><span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700"><StepIcon className="h-5 w-5" /></span></div><h3 className="mt-6 text-lg font-semibold text-slate-950">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-500">{step.description}</p></m.article>; })}</div></div></section>

          <section id="themes" className="scroll-mt-28 border-y border-slate-200 bg-slate-50 py-12 sm:py-16 lg:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading badge={dictionary.landingThemesBadge} lead={dictionary.landingThemesTitleLead} accent={dictionary.landingThemesTitleAccent} description={dictionary.landingThemesDescription} /><div className="theme-marquee mt-10 px-0.5"><div className="theme-marquee-track">{[0, 1].map((loopIndex) => <div className="theme-marquee-group" key={`theme-loop-${loopIndex}`}>{THEME_PREVIEWS.map((theme, index) => <PhonePreviewMockup key={`${theme.name}-${loopIndex}`} className={cn("w-[206px] flex-none sm:w-[224px]", index === 0 && "ring-2 ring-zinc-900")} gradientClassName={theme.bg} name={theme.name} handle={theme.handle.replace("@", "")} avatarUrl={featuredCreators[0]?.image || ""} avatarText={getThemeAvatarLetter(theme.name)} rows={themeFeatureRows} textTone={theme.textTone} compact />)}</div>)}</div></div><div className="mt-8 flex justify-center"><a href="#pricing"><Button variant="secondary">{dictionary.landingThemesCta}<ArrowRight className="h-4 w-4" /></Button></a></div></div></section>

          <section id="pricing" className="scroll-mt-28 bg-slate-50 py-12 sm:py-16 lg:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionHeading badge={dictionary.landingPricingBadge} lead={dictionary.landingPricingTitleLead} accent={dictionary.landingPricingTitleAccent} description={dictionary.landingPricingDescription} /><div className="mt-10 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5 sm:p-8"><div className="text-center"><h3 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{locale === "en" ? "Choose your perfect plan" : "Pilih paket terbaikmu"}</h3><p className="mt-2 text-sm text-slate-500 sm:text-base">{locale === "en" ? "Pick once, then continue to secure checkout." : "Pilih paket yang cocok, lalu lanjutkan ke checkout pembayaran yang aman."}</p></div><div className="mt-8 grid gap-4 lg:grid-cols-3">{pricingPlans.map((plan) => <Link key={plan.name} href={PRICING_PLAN_HREF_BY_ID[plan.id]} className={cn("relative flex h-full flex-col rounded-2xl border bg-white p-6 transition hover:-translate-y-0.5", plan.featured ? "border-zinc-900 ring-1 ring-zinc-900" : "border-slate-200")}>{plan.featured ? <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">{locale === "en" ? "Most popular" : "Paling populer"}</span> : null}<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{plan.name}</p><p className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">{plan.monthlyPrice}<span className="ml-1 text-sm font-medium text-slate-500">{locale === "en" ? "/month" : "/bulan"}</span></p><p className="mt-3 text-sm leading-relaxed text-slate-500">{plan.subtitle}</p></Link>)}</div><div className="mt-8 flex justify-center"><Link href="/payment?plan=creator"><Button className="px-6">{locale === "en" ? "Choose plan & continue" : "Pilih paket & lanjutkan"}</Button></Link></div></div></div></section>

          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20"><SectionHeading badge={dictionary.landingTestimonialsBadge} lead={dictionary.landingTestimonialsTitleLead} accent={dictionary.landingTestimonialsTitleAccent} description={dictionary.landingTestimonialsDescription} /><div className="mt-10 grid gap-4 lg:grid-cols-3">{marketingTestimonials.map((item) => <article key={item.name} className={cn("rounded-2xl border p-6 shadow-sm shadow-slate-900/5", item.light ? "border-slate-200 bg-white text-slate-950" : "border-zinc-900 bg-zinc-900 text-white")}><div className="mb-4 flex items-center gap-2"><div className="flex items-center gap-1">{Array.from({ length: 5 }).map((_, index) => <Star key={`${item.name}-star-${index}`} className={cn("h-4 w-4", index < item.rating ? item.light ? "fill-slate-900 text-slate-900" : "fill-white text-white" : item.light ? "fill-slate-200 text-slate-200" : "fill-white/20 text-white/20")} />)}</div><span className={cn("text-xs font-semibold", item.light ? "text-slate-500" : "text-zinc-300")}>{item.rating}/5</span></div><p className={cn("text-sm leading-relaxed", item.light ? "text-slate-700" : "text-white/90")}>&ldquo;{item.quote}&rdquo;</p><div className="mt-6 flex items-center gap-3"><span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold", item.light ? "bg-slate-100 text-slate-700" : "bg-white/10 text-white")}>{item.name.charAt(0)}</span><div><p className="font-semibold">{item.name}</p><p className={cn("text-xs", item.light ? "text-slate-500" : "text-zinc-300")}>{item.role}</p></div></div></article>)}</div></section>

          <section id="faq" className="scroll-mt-28 border-y border-slate-200 bg-slate-50 py-12 sm:py-16 lg:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="mx-auto max-w-3xl"><SectionHeading badge={dictionary.landingFaqBadge} lead={dictionary.landingFaqTitleLead} accent={dictionary.landingFaqTitleAccent} description={dictionary.landingFaqDescription} /><div className="mt-10 rounded-2xl border border-slate-200 bg-white px-5 shadow-sm shadow-slate-900/5 sm:px-6">{marketingFaqItems.map((item, index) => <LandingFaqItem key={item.question} question={item.question} answer={item.answer} open={openFaqIndex === index} onToggle={() => setOpenFaqIndex((prev) => (prev === index ? -1 : index))} />)}</div></div></div></section>

          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="relative overflow-hidden rounded-3xl border border-zinc-900 bg-zinc-950 px-5 py-12 text-white shadow-sm sm:px-8 sm:py-16 lg:px-14"><div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_36%)]" />{!prefersReducedMotion ? <video className="absolute inset-0 h-full w-full object-cover opacity-15 grayscale" autoPlay muted loop playsInline preload="metadata" aria-hidden="true"><source src="/hero-loop.mp4" type="video/mp4" /></video> : null}<div className="relative z-10 mx-auto max-w-3xl text-center"><Badge variant="dark" className="border-white/10 bg-white/10 text-white">{dictionary.landingFinalBadge}</Badge><h2 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-6xl">{dictionary.landingFinalTitleLead} <span className="font-accent text-zinc-300">{dictionary.landingFinalTitleAccent}</span> {dictionary.landingFinalTitleTail}</h2><p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-300 sm:text-lg">{dictionary.landingFinalDescription}</p><div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"><Link href="/auth/signup" className="w-full sm:w-auto"><Button className="w-full bg-white text-zinc-950 hover:bg-slate-100 sm:w-auto sm:min-w-[230px]">{dictionary.landingFinalPrimaryCta}<ArrowRight className="h-4 w-4" /></Button></Link><Link href="/videos" className="w-full sm:w-auto"><Button variant="secondary" className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 sm:w-auto sm:min-w-[182px]"><PlayCircle className="h-4 w-4" />{dictionary.landingFinalSecondaryCta}</Button></Link></div><div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-300">{[dictionary.landingFinalPointFast, dictionary.landingFinalPointFree, dictionary.landingFinalPointFlexible].map((point) => <p key={point} className="inline-flex items-center gap-2"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white"><Check className="h-3.5 w-3.5" /></span>{point}</p>)}</div></div></div></section>
        </main>

        <footer className="mt-8 border-t border-slate-200 bg-white"><div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.7fr_0.7fr_0.7fr] lg:px-8"><div><AppLogo /><p className="mt-4 max-w-md text-sm leading-relaxed text-slate-500">{locale === "en" ? "showreels.id helps creators present their best work with clean, client-ready public pages." : "showreels.id membantu creator menampilkan karya terbaik dengan halaman publik yang rapi dan siap dilihat klien."}</p></div>{[{ title: "Company", links: [["About", "/about"], ["Register Creator", "/auth/signup"], ["Dashboard", "/dashboard"]] }, { title: "Support", links: [["Customer Service", "/customer-service"], ["Login", "/auth/login"]] }, { title: "Legal", links: [["Legal", "/legal"], ["Syarat", "/legal/syarat"], ["Privasi", "/legal/privasi"], ["Cookies", "/legal/cookies"], ["DPA", "/legal/dpa"]] }].map((group) => <div key={group.title}><p className="font-semibold text-slate-950">{group.title}</p><div className="mt-3 space-y-2 text-sm text-slate-500">{group.links.map(([label, href]) => <Link key={href} href={href} className="block transition hover:text-slate-950">{label}</Link>)}</div></div>)}</div><div className="border-t border-slate-200"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 text-xs text-slate-400 sm:px-6 lg:px-8"><p>Copyright {year} showreels.id. All rights reserved.</p><p className="hidden items-center gap-1 sm:inline-flex"><ChevronDown className="h-4 w-4 rotate-[-90deg]" />Creator-first platform</p></div></div></footer>
      </div>
    </LazyMotion>
  );
}
