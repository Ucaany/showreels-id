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
  {
    name: "Creator Clean",
    handle: "@creator.clean",
    bg: "from-slate-50 to-slate-200",
    textTone: "dark" as const,
  },
  {
    name: "Portfolio Warm",
    handle: "@creator.warm",
    bg: "from-slate-100 to-slate-300",
    textTone: "dark" as const,
  },
  {
    name: "Studio Focus",
    handle: "@creator.studio",
    bg: "from-zinc-100 to-zinc-300",
    textTone: "dark" as const,
  },
  {
    name: "Editorial Soft",
    handle: "@creator.editorial",
    bg: "from-stone-100 to-stone-300",
    textTone: "dark" as const,
  },
  {
    name: "Minimal Contrast",
    handle: "@creator.minimal",
    bg: "from-zinc-700 to-zinc-950",
    textTone: "light" as const,
  },
];

const PLATFORM_SOURCES = [
  {
    name: "Google Drive",
    helper: "Drive",
    icon: SiGoogledrive,
    brandColor: "#4285F4",
    lightBg: "#E8F0FE",
  },
  {
    name: "YouTube",
    helper: "YouTube",
    icon: SiYoutube,
    brandColor: "#FF0000",
    lightBg: "#FFEBEE",
  },
  {
    name: "Instagram",
    helper: "Instagram",
    icon: SiInstagram,
    brandColor: "#E4405F",
    lightBg: "#FCE4EC",
  },
  {
    name: "Vimeo",
    helper: "Vimeo",
    icon: SiVimeo,
    brandColor: "#1AB7EA",
    lightBg: "#E1F5FE",
  },
  {
    name: "Facebook",
    helper: "Facebook",
    icon: SiFacebook,
    brandColor: "#1877F2",
    lightBg: "#E3F2FD",
  },
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

function createSeededHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function sanitizeUsernameInput(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
}

function getThemeAvatarLetter(value: string) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letters[createSeededHash(value) % letters.length] || "S";
}

function LandingFaqItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <m.article layout className="border-b border-slate-200">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-5 text-left sm:py-6"
      >
        <span className="text-card-title max-w-[90%] font-semibold text-slate-950">
          {question}
        </span>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
          {open ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <p className="text-body-base max-w-3xl pb-6 text-slate-600">{answer}</p>
          </m.div>
        ) : null}
      </AnimatePresence>
    </m.article>
  );
}

type PreviewPhoneCardRow = {
  label: string;
  icon: IconType;
  status?: string;
};

function PhonePreviewMockup({
  className,
  gradientClassName,
  name,
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
        compact
          ? "aspect-[9/16.35] rounded-[2.05rem]"
          : compactHeight
            ? "aspect-[9/15.75] rounded-[2.28rem]"
            : "aspect-[9/17.15] rounded-[2.28rem]",
        "border-[2.5px] border-slate-900/45 bg-transparent p-[2px] shadow-none ring-1 ring-slate-200/80",
        className
      )}
    >
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden bg-gradient-to-b px-3 pb-3.5 pt-3 backdrop-blur-[1px] sm:px-3.5",
          compact ? "rounded-[1.82rem]" : "rounded-[2.02rem]",
          compact ? "space-y-0" : "space-y-1",
          gradientClassName
        )}
      >
        {backgroundVideoSrc ? (
          <>
            <video
              className="absolute inset-0 h-full w-full object-cover brightness-[0.76] opacity-55 saturate-[0.88]"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
            >
              <source src={backgroundVideoSrc} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,22,48,0.44),rgba(18,55,126,0.52),rgba(6,17,38,0.66))]" />
          </>
        ) : null}
        <div className="relative z-10 mx-auto h-2.5 w-16 rounded-full bg-slate-950" />
        <div
          className={cn(
            "relative z-10 mx-auto w-fit rounded-full border-2 border-white/55 bg-white/92",
            compact ? "mt-2 p-1" : "mt-3 p-1.5"
          )}
        >
          {avatarText ? (
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-full bg-slate-100 font-extrabold text-slate-600",
                compact ? "h-10 w-10 text-[0.9rem]" : "h-14 w-14 text-[1.15rem]"
              )}
            >
              {avatarText}
            </span>
          ) : !hasAvatarImage ? (
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-600",
                compact ? "h-10 w-10" : "h-14 w-14"
              )}
            >
              <UserRound className={cn(compact ? "h-5 w-5" : "h-7 w-7")} />
            </span>
          ) : (
            <AvatarBadge name={name} avatarUrl={avatarUrl} size={avatarSize} />
          )}
        </div>
        <p
          className={cn(
            "relative z-10 mt-2.5 text-center font-bold tracking-[-0.02em]",
            compact ? "text-[0.98rem] sm:text-[1.04rem]" : "text-[1.2rem] sm:text-[1.34rem]",
            isLightTone ? "text-white" : "text-slate-950"
          )}
        >
          {name}
        </p>
 
        <div
          className={cn(
            "relative z-10 shrink-0",
            compact ? "mt-2 space-y-1.5" : "mt-3 space-y-2"
          )}
        >
          {rows.map((row) => {
            const RowIcon = row.icon;

            return (
              <div
                key={`${row.label}-${row.status || "row"}`}
                className={cn(
                  "flex items-center justify-between rounded-2xl border border-white/70 bg-white/96 text-slate-800",
                  compact ? "min-h-8 px-2 py-1.5" : "min-h-[2.6rem] px-3 py-2"
                )}
              >
                <span
                  className={cn(
                    "inline-flex min-w-0 items-center gap-2 font-semibold tracking-[-0.01em]",
                    compact ? "text-[0.72rem]" : "text-[0.82rem]"
                  )}
                >
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                    <RowIcon className="h-3 w-3" />
                  </span>
                  <span className="truncate">{row.label}</span>
                </span>
                {row.status ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">
                    {row.status}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

        {footer ? (
          <p
            className={cn(
              "relative z-10 mt-auto pt-3 text-center text-[0.69rem] font-medium tracking-[0.08em]",
              isLightTone ? "text-white/60" : "text-slate-500/80"
            )}
          >
            {footer}
          </p>
        ) : null}
      </div>
    </div>
  );
}

interface LandingPageProps {
  creatorCount: number;
  videoCount: number;
  featuredCreators: Array<{
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    bio: string;
    city: string;
    createdAt: Date;
  }>;
  currentUser?: {
    name: string | null;
    username: string | null;
    image: string | null;
    email: string;
  } | null;
}

export function LandingPage({
  creatorCount,
  videoCount,
  featuredCreators,
  currentUser = null,
}: LandingPageProps) {
  const { dictionary, locale, setLocale } = usePreferences();
  const prefersReducedMotion = useReducedMotion();
  const year = new Date().getFullYear();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const [usernameInput, setUsernameInput] = useState("");
  const [usernameAsyncStatus, setUsernameAsyncStatus] = useState<
    Exclude<UsernameStatus, "invalid">
  >("idle");
  const [usernameSuggestion, setUsernameSuggestion] = useState("");

  const loginLabel = dictionary.login?.trim() || (locale === "en" ? "Login" : "Masuk");

  const sanitizedUsername = useMemo(
    () => sanitizeUsernameInput(usernameInput),
    [usernameInput]
  );

  const rawUsernameInput = usernameInput.trim();
  const isUsernameFormatValid = /^[a-zA-Z0-9_]{3,24}$/.test(rawUsernameInput);
  const usernameStatus: UsernameStatus = !rawUsernameInput
    ? "idle"
    : !isUsernameFormatValid
      ? "invalid"
      : usernameAsyncStatus;

  useEffect(() => {
    if (!isUsernameFormatValid) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/public/username-availability?username=${encodeURIComponent(rawUsernameInput)}`,
          { signal: controller.signal }
        );
        const payload = (await response.json().catch(() => null)) as
          | {
              reason?: UsernameStatus;
              available?: boolean;
              suggestion?: string;
            }
          | null;

        if (!response.ok || !payload) {
          setUsernameAsyncStatus("idle");
          setUsernameSuggestion("");
          return;
        }

        if (payload.reason === "available") {
          setUsernameAsyncStatus("available");
          setUsernameSuggestion("");
          return;
        }

        if (payload.reason === "taken") {
          setUsernameAsyncStatus("taken");
          setUsernameSuggestion(payload.suggestion || "");
          return;
        }

        setUsernameAsyncStatus("idle");
        setUsernameSuggestion(payload.suggestion || "");
      } catch {
        setUsernameAsyncStatus("idle");
        setUsernameSuggestion("");
      }
    }, 360);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [isUsernameFormatValid, rawUsernameInput]);

  const marketingFeatures = useMemo(
    () => [
      {
        title: locale === "en" ? "Public creator profile" : "Profil creator publik",
        description:
          locale === "en"
            ? "Avatar, cover, bio, contact, and skills in one share-ready profile."
            : "Avatar, cover, bio, kontak, dan skills dalam satu profil siap dibagikan.",
      },
      {
        title:
          locale === "en"
            ? "Public video page by slug"
            : "Halaman video publik per slug",
        description:
          locale === "en"
            ? "Every published video has its own clean public page, ready to share."
            : "Setiap video memiliki halaman publik tersendiri yang siap dibagikan.",
      },
      {
        title:
          locale === "en"
            ? "Multi-source video support"
            : "Sumber video multi-platform",
        description:
          locale === "en"
            ? "Use YouTube, Drive, Instagram, Facebook, or Vimeo as video sources."
            : "Pakai YouTube, Drive, Instagram, Facebook, atau Vimeo sebagai sumber video.",
      },
      {
        title: locale === "en" ? "Visibility control" : "Kontrol visibilitas",
        description:
          locale === "en"
            ? "Choose draft, private, semi_private, or public for each content."
            : "Atur draft, private, semi_private, atau public untuk tiap konten.",
      },
    ],
    [locale]
  );

  const marketingTestimonials = useMemo(
    () => [
      {
        quote:
          locale === "en"
            ? "Now they just open one page to see my profile, skills, and videos. The review process is so much faster."
            : "Sekarang cukup buka satu halaman untuk melihat profil, keahlian, dan video saya. Proses review jadi lebih cepat.",
        name: "Nadia Putri",
        role:
          locale === "en"
            ? "Freelance Video Editor"
            : "Freelance Video Editor",
        light: true,
        rating: 5,
      },
      {
        quote:
          locale === "en"
            ? "Semi-private visibility helps me send selected cuts to brands before public release, while keeping the same profile."
            : "Mode semi-private membantu saya kirim cut tertentu ke brand sebelum public, tanpa bikin profil baru.",
        name: "Dio Pratama",
        role:
          locale === "en"
            ? "Content Creator"
            : "Kreator Konten",
        light: false,
        rating: 4,
      },
      {
        quote:
          locale === "en"
            ? "Custom links and contact links make media kit, WhatsApp, and booking access clearer for collaborators."
            : "Custom links dan contact links bikin akses ke media kit, WhatsApp, dan booking jadi jauh lebih jelas.",
        name: "Raka Maulana",
        role:
          locale === "en"
            ? "Videographer"
            : "Videografer",
        light: true,
        rating: 5,
      },
    ],
    [locale]
  );

  const marketingFaqItems = useMemo(
    () => [
      {
        question:
          locale === "en"
            ? "Can I set my profile or videos to private?"
            : "Apakah profil atau video bisa dibuat private?",
        answer:
          locale === "en"
            ? "Yes. Showreels supports draft, private, semi_private, and public states so you can control who sees each content."
            : "Bisa. Showreels mendukung status draft, private, semi_private, dan public agar kamu bisa kontrol siapa yang melihat konten.",
      },
      {
        question:
          locale === "en"
            ? "Does each video have its own public page?"
            : "Apakah setiap video punya halaman publik sendiri?",
        answer:
          locale === "en"
            ? "Yes. Each published video gets a public slug page and can be shared directly."
            : "Ya. Setiap video yang dipublikasikan punya halaman slug publik dan bisa dibagikan langsung.",
      },
      {
        question:
          locale === "en"
            ? "Which video sources are supported?"
            : "Sumber video apa saja yang didukung?",
        answer:
          locale === "en"
            ? "You can submit videos from YouTube, Google Drive, Instagram, Facebook, and Vimeo."
            : "Kamu bisa submit video dari YouTube, Google Drive, Instagram, Facebook, dan Vimeo.",
      },
      {
        question:
          locale === "en"
            ? "Can I add custom links and social/contact links?"
            : "Bisakah menambah custom link dan social/contact links?",
        answer:
          locale === "en"
            ? "Yes. You can arrange priority custom links and social/contact links from your creator dashboard."
            : "Bisa. Kamu dapat mengatur custom link prioritas dan social/contact links langsung dari dashboard creator.",
      },
      {
        question:
          locale === "en"
            ? "What is the difference between draft, private, semi_private, and public?"
            : "Apa beda draft, private, semi_private, dan public?",
        answer:
          locale === "en"
            ? "Draft is for editing, private is hidden, semi_private is shared to selected audience, and public is visible to everyone."
            : "Draft untuk proses edit, private tersembunyi, semi_private dibagikan terbatas, dan public terlihat oleh semua orang.",
      },
    ],
    [locale]
  );

  const previewPlatformRows = useMemo(
    () =>
      PREVIEW_PLATFORM_ROWS.map((item, index) => ({
        ...item,
        status:
          locale === "en"
            ? ["active", "ready", "shown", "open", "live"][index]
            : ["aktif", "siap", "tampil", "buka", "live"][index],
      })),
    [locale]
  );

  const themeFeatureRows = useMemo(
    () => [
      {
        label: dictionary.landingThemesFeatureCustomLinks,
        icon: SiGoogledrive,
      },
      {
        label: dictionary.landingThemesFeatureSocialLinks,
        icon: SiYoutube,
      },
      {
        label: dictionary.landingThemesFeatureVideoHighlight,
        icon: SiInstagram,
      },
      {
        label: dictionary.landingThemesFeatureContact,
        icon: SiVimeo,
      },
    ],
    [
      dictionary.landingThemesFeatureContact,
      dictionary.landingThemesFeatureCustomLinks,
      dictionary.landingThemesFeatureSocialLinks,
      dictionary.landingThemesFeatureVideoHighlight,
    ]
  );

  const pricingPlans = useMemo(
    () => [
      {
        id: "free" as PricingPlanId,
        name: "Free",
        monthlyPrice: "Rp0",
        subtitle: dictionary.landingPricingFree,
        featured: false,
      },
      {
        id: "creator" as PricingPlanId,
        name: "Creator",
        monthlyPrice: "Rp25.000",
        subtitle: dictionary.landingPricingCreator,
        featured: true,
      },
      {
        id: "business" as PricingPlanId,
        name: "Business",
        monthlyPrice: "Rp49.000",
        subtitle: dictionary.landingPricingTeam,
        featured: false,
      },
    ],
    [
      dictionary.landingPricingCreator,
      dictionary.landingPricingFree,
      dictionary.landingPricingTeam,
    ]
  );

  const statusLabel =
    usernameStatus === "checking"
      ? dictionary.landingHeroStatusChecking
      : usernameStatus === "available"
        ? dictionary.landingHeroStatusAvailable
        : usernameStatus === "taken"
          ? dictionary.landingHeroStatusTaken
          : usernameStatus === "invalid"
            ? dictionary.landingHeroStatusInvalid
            : dictionary.landingHeroStatusIdle;

  const sectionBadgeClass =
    "rounded-full border border-[#dbe5ff] bg-[#eef4ff] px-2.5 py-1 text-eyebrow font-semibold uppercase text-[#1a46c9] shadow-none";
  const sectionTitleClass =
    "mt-3 font-display text-section-display font-extrabold text-slate-950";
  const sectionDescriptionClass = "mt-3 max-w-3xl text-body-lg text-slate-600";
  const centeredSectionDescriptionClass = cn(sectionDescriptionClass, "mx-auto");
  const accentTextClass = "font-accent text-[#1a46c9]";
  const statusToneClass =
    usernameStatus === "available"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : usernameStatus === "taken" || usernameStatus === "invalid"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : usernameStatus === "checking"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-white text-slate-500";
  const statusDotClass =
    usernameStatus === "available"
      ? "bg-emerald-500"
      : usernameStatus === "taken" || usernameStatus === "invalid"
        ? "bg-rose-500"
        : usernameStatus === "checking"
          ? "bg-amber-500"
          : "bg-slate-400";
  const desktopLanguageLinkClass =
    "inline-flex min-h-8 items-center rounded-full px-3 text-[0.78rem] font-bold uppercase tracking-[0.08em] transition";
  const mobileLanguageLinkClass =
    "inline-flex min-h-8 items-center rounded-full px-3 text-[0.78rem] font-bold uppercase tracking-[0.08em] transition";
  const activeLanguageClass = "bg-white text-[#1a46c9] shadow-sm ring-1 ring-[#dbe5ff]";
  const inactiveLanguageClass = "text-slate-500 hover:bg-white/70 hover:text-slate-900";

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="min-h-screen overflow-x-clip bg-canvas text-slate-950">
        <header className="fixed left-0 right-0 top-0 z-[70] border-b border-slate-200 bg-white/92 backdrop-blur">
          <div className="mx-auto flex min-h-[4.55rem] w-full max-w-[1160px] items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
            <AppLogo />

            <nav className="hidden items-center gap-5 text-[0.95rem] font-semibold tracking-[-0.012em] text-slate-900 lg:flex">
              <a
                href="#features"
                className="inline-flex min-h-11 items-center transition hover:text-slate-950"
              >
                {dictionary.landingNavFeatures}
              </a>
              <a
                href="#themes"
                className="inline-flex min-h-11 items-center transition hover:text-slate-950"
              >
                {dictionary.landingNavThemes}
              </a>
              <a
                href="#pricing"
                className="inline-flex min-h-11 items-center transition hover:text-slate-950"
              >
                {dictionary.landingNavPricing}
              </a>
              <a
                href="#faq"
                className="inline-flex min-h-11 items-center transition hover:text-slate-950"
              >
                {dictionary.landingNavFaq}
              </a>
            </nav>

            <div className="hidden items-center gap-2.5 lg:flex">
              <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100/80 p-1 shadow-sm shadow-slate-900/5">
                <button
                  type="button"
                  onClick={() => setLocale("id")}
                  className={cn(
                    desktopLanguageLinkClass,
                    locale === "id" ? activeLanguageClass : inactiveLanguageClass
                  )}
                  aria-label={`${dictionary.language} ID`}
                >
                  ID
                </button>
                <button
                  type="button"
                  onClick={() => setLocale("en")}
                  className={cn(
                    desktopLanguageLinkClass,
                    locale === "en" ? activeLanguageClass : inactiveLanguageClass
                  )}
                  aria-label={`${dictionary.language} EN`}
                >
                  EN
                </button>
              </div>
              {currentUser ? (
                <>
                  <Link
                    href="/dashboard"
                    className="inline-flex min-h-11 items-center px-2 text-[0.95rem] font-semibold tracking-[-0.012em] text-black transition hover:text-slate-950"
                  >
                    Dashboard
                  </Link>
                  <div className="inline-flex min-h-11 items-center px-1">
                    <AvatarBadge
                      name={currentUser.name || "Creator"}
                      avatarUrl={currentUser.image || ""}
                      size="sm"
                    />
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="inline-flex min-h-11 items-center px-2 text-[0.95rem] font-semibold tracking-[-0.012em] text-black transition hover:text-slate-950"
                  >
                    {loginLabel}
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="inline-flex min-h-11 items-center px-2 text-[0.95rem] font-semibold tracking-[-0.012em] text-black transition hover:text-slate-950"
                  >
                    {dictionary.signup}
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              className="inline-flex h-12 w-12 items-center justify-center rounded-[1.15rem] border border-slate-200 bg-white text-slate-700 lg:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-[80] bg-slate-950/40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 h-full w-full cursor-default"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu backdrop"
            />
            <aside className="absolute right-0 top-0 h-full w-[min(88vw,360px)] border-l border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <AppLogo />
                <button
                  type="button"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-[1.05rem] border border-slate-200 bg-white text-slate-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 pb-7 pt-2">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-1 py-2 text-[0.95rem] font-semibold tracking-[-0.01em] text-black transition hover:text-slate-950"
                >
                  {dictionary.landingNavFeatures}
                </a>
                <a
                  href="#themes"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-1 py-2 text-[0.95rem] font-semibold tracking-[-0.01em] text-black transition hover:text-slate-950"
                >
                  {dictionary.landingNavThemes}
                </a>
                <a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-1 py-2 text-[0.95rem] font-semibold tracking-[-0.01em] text-black transition hover:text-slate-950"
                >
                  {dictionary.landingNavPricing}
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-1 py-2 text-[0.95rem] font-semibold tracking-[-0.01em] text-black transition hover:text-slate-950"
                >
                  {dictionary.landingNavFaq}
                </a>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100/80 p-1 shadow-sm shadow-slate-900/5">
                  <button
                    type="button"
                    onClick={() => setLocale("id")}
                    className={cn(
                      mobileLanguageLinkClass,
                      locale === "id" ? activeLanguageClass : inactiveLanguageClass
                    )}
                    aria-label={`${dictionary.language} ID`}
                  >
                    ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocale("en")}
                    className={cn(
                      mobileLanguageLinkClass,
                      locale === "en" ? activeLanguageClass : inactiveLanguageClass
                    )}
                    aria-label={`${dictionary.language} EN`}
                  >
                    EN
                  </button>
                </div>
                <div className="mt-6 space-y-3">
                  {currentUser ? (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2 text-[0.95rem] font-semibold text-black transition hover:text-slate-950"
                      >
                        Dashboard
                      </Link>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 py-2 text-[0.95rem] font-semibold text-black transition hover:text-slate-950"
                        onClick={async () => {
                          const supabase = createClient();
                          await supabase?.auth.signOut();
                          window.location.replace("/");
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-5">
                        <Link
                          href="/auth/login"
                          onClick={() => setMobileMenuOpen(false)}
                          className="inline-flex min-h-10 items-center text-[0.95rem] font-semibold text-black transition hover:text-slate-950"
                        >
                          {loginLabel}
                        </Link>
                        <Link
                          href="/auth/signup"
                          onClick={() => setMobileMenuOpen(false)}
                          className="inline-flex min-h-10 items-center text-[0.95rem] font-semibold text-black transition hover:text-slate-950"
                        >
                          {dictionary.signup}
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </aside>
          </div>
        ) : null}

        <main className="overflow-x-clip pb-14 pt-[4.72rem] sm:pt-[4.95rem]">
          <section className="mx-auto w-full max-w-[1160px] overflow-visible px-4 pb-12 pt-16 sm:overflow-hidden sm:px-6 sm:pb-16 sm:pt-14 lg:px-8 lg:pb-20 lg:pt-16">
            <div className="grid items-center gap-9 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:gap-11">
              <div className="mx-auto min-w-0 max-w-[36rem] text-center lg:mx-0 lg:text-left">
                <Badge className="max-w-[calc(100vw-2rem)] overflow-hidden rounded-full border border-[#dbe5ff] bg-[#eef4ff]/90 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] !text-[#1a46c9] shadow-none backdrop-blur-[1px] sm:text-eyebrow">
                  <span className="inline-flex max-w-full min-w-0 items-center gap-2">
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#1a46c9] shadow-[0_0_0_3px_rgba(26,70,201,0.14)]">
                      <span className="absolute inset-0 animate-ping rounded-full bg-[#1a46c9]/45" />
                    </span>
                    <span className="min-w-0 truncate">{dictionary.landingHeroBadge}</span>
                  </span>
                </Badge>
                <h1 className="mt-4 max-w-full overflow-visible pb-1 font-display text-hero-display font-semibold text-slate-950">
                  {dictionary.landingHeroTitleLead}
                  <span className={cn("mt-1 block pb-1 font-normal leading-[1.02] text-hero-accent", accentTextClass)}>
                    {dictionary.landingHeroTitleAccent}
                  </span>
                </h1>
                <p className="mx-auto mt-4 max-w-[35rem] text-body-lg text-slate-600 lg:mx-0">
                  {dictionary.landingHeroDescription}
                </p>

                <form
                  className="mx-auto mt-5 w-full max-w-[31rem] rounded-[1.14rem] border border-slate-200/80 bg-white/45 p-[0.22rem] shadow-none backdrop-blur-md sm:mt-6 sm:rounded-[1.2rem] sm:p-1 lg:mx-0"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (usernameStatus !== "available") {
                      return;
                    }
                    window.location.assign(
                      `/auth/signup?username=${encodeURIComponent(sanitizedUsername)}`
                    );
                  }}
                >
                  <div className="grid min-w-0 grid-cols-1 items-stretch gap-[3px] min-[380px]:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden rounded-[0.9rem] bg-white/55 px-2.5 sm:gap-1.5 sm:rounded-[0.95rem] sm:px-3">
                      <label
                        htmlFor="hero-username"
                        className="shrink-0 text-[0.8rem] font-semibold tracking-[-0.006em] text-slate-800 sm:text-[0.89rem]"
                      >
                        showreels.id/
                      </label>
                      <Input
                        id="hero-username"
                        value={usernameInput}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          const trimmed = nextValue.trim();
                          const valid = /^[a-zA-Z0-9_]{3,24}$/.test(trimmed);

                          setUsernameInput(nextValue);
                          setUsernameSuggestion("");
                          setUsernameAsyncStatus(valid ? "checking" : "idle");
                        }}
                        placeholder={dictionary.landingHeroInputPlaceholder}
                        className="h-[2.62rem] min-w-0 !w-auto flex-1 border-none bg-transparent px-0 text-[0.9rem] font-medium text-slate-950 shadow-none placeholder:text-slate-400 focus:ring-0 sm:h-[2.85rem] sm:text-[0.96rem]"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="h-[2.62rem] w-full shrink-0 !shadow-none bg-[#1a46c9] px-4 font-bold text-white hover:bg-[#153aa8] min-[380px]:w-[5.5rem] min-[380px]:px-2 sm:h-[2.85rem] sm:w-[6.8rem] sm:px-4"
                      disabled={usernameStatus !== "available"}
                    >
                      {dictionary.landingHeroInputAction}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
                <div
                  className={cn(
                    "mx-auto mt-2 inline-flex max-w-full items-center gap-2 overflow-hidden rounded-full border px-2.5 py-1 text-[0.84rem] font-medium leading-tight sm:text-helper lg:mx-0",
                    statusToneClass
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-full", statusDotClass)} />
                  <span className="min-w-0 truncate">
                    {statusLabel}
                    {usernameStatus === "taken" && usernameSuggestion
                      ? ` (${locale === "en" ? "Try" : "Coba"} @${usernameSuggestion})`
                      : ""}
                  </span>
                </div>

                <div className="mx-auto mt-5 flex max-w-full flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-helper font-medium text-slate-600 lg:mx-0 lg:justify-start">
                  <div className="flex -space-x-2.5">
                    {featuredCreators.slice(0, 4).map((creator) => (
                      <AvatarBadge
                        key={creator.id}
                        name={creator.name || "Creator"}
                        avatarUrl={creator.image || ""}
                        size="sm"
                      />
                    ))}
                  </div>
                  <p className="min-w-0 leading-tight">
                    {creatorCount.toLocaleString(locale === "en" ? "en-US" : "id-ID")}{" "}
                    {locale === "en" ? "creators are active today" : "creator aktif hari ini"}
                  </p>
                  <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:inline-flex" />
                  <p className="min-w-0 leading-tight">
                    {videoCount.toLocaleString(locale === "en" ? "en-US" : "id-ID")}{" "}
                    {locale === "en" ? "videos published" : "video dipublish"}
                  </p>
                </div>
              </div>

              <m.div
                className="relative mx-auto w-full max-w-[340px] lg:max-w-[360px]"
                animate={prefersReducedMotion ? undefined : { y: [0, -10, 0] }}
                transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <PhonePreviewMockup
                  className="mx-auto w-full max-w-[318px] sm:max-w-[336px]"
                  gradientClassName="from-slate-100 to-slate-400"
                  name={featuredCreators[0]?.name || "Creator Demo"}
                  handle={featuredCreators[0]?.username || "creator.demo"}
                  avatarUrl={featuredCreators[0]?.image || ""}
                  rows={previewPlatformRows}
                  footer="showreels.id/creator.demo"
                  backgroundVideoSrc={prefersReducedMotion ? undefined : "/hero-loop.mp4"}
                  avatarSize="lg"
                  textTone="light"
                  compactHeight
                />

                <m.div
                  className="absolute -left-7 top-9 hidden rounded-xl border border-[#dbe5ff] bg-white px-3.5 py-2.5 text-[0.84rem] shadow-sm lg:block"
                  animate={prefersReducedMotion ? undefined : { y: [0, -8, 0] }}
                  transition={{
                    duration: 6.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.35,
                  }}
                >
                  <p className="text-slate-500">
                    {locale === "en" ? "Profile mode" : "Mode profil"}
                  </p>
                  <p className="text-[1.05rem] font-semibold text-slate-950">
                    {locale === "en" ? "Public active" : "Public aktif"}
                  </p>
                </m.div>
                <m.div
                  className="absolute -right-8 bottom-12 hidden rounded-xl border border-[#dbe5ff] bg-white px-3.5 py-2.5 text-[0.84rem] shadow-sm lg:block"
                  animate={prefersReducedMotion ? undefined : { y: [0, 8, 0] }}
                  transition={{
                    duration: 6.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.7,
                  }}
                >
                  <p className="text-slate-500">
                    {locale === "en" ? "Your link" : "Link kamu"}
                  </p>
                  <p className="text-[1.05rem] font-semibold text-[#1a46c9]">
                    showreels.id
                  </p>
                </m.div>
              </m.div>
            </div>
          </section>

          <section
            className="relative bg-slate-50 py-10 sm:py-12 lg:py-14"
            id="features"
          >
            <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-7 sm:mb-8">
                <Badge className={sectionBadgeClass}>
                  {dictionary.landingFeaturesBadge}
                </Badge>
                <h2 className={sectionTitleClass}>
                  {dictionary.landingFeaturesTitleLead}{" "}
                  <span className={accentTextClass}>
                    {dictionary.landingFeaturesTitleAccent}
                  </span>
                </h2>
                <p className={centeredSectionDescriptionClass}>
                  {dictionary.landingFeaturesDescription}
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-stretch">
                {/* Card 1: Profil Creator Publik (Hero) */}
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: 0 }}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md shadow-slate-900/5 transition-shadow hover:shadow-lg hover:shadow-[#1a46c9]/10"
                >
                  {/* Cover */}
                  <div className="h-20 bg-gradient-to-br from-slate-100 via-white to-[#eef4ff] sm:h-24" />
                  
                  {/* Content */}
                  <div className="relative p-4 sm:p-5">
                    {/* Avatar */}
                    <div className="absolute -top-7 left-4 sm:-top-8 sm:left-5">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#eef4ff] sm:h-16 sm:w-16">
                        <UserRound className="h-7 w-7 text-[#1a46c9] sm:h-8 sm:w-8" />
                      </div>
                    </div>
                    
                    {/* Name & Bio */}
                    <div className="mt-8 sm:mt-9">
                      <h3 className="text-base font-bold text-slate-800 sm:text-lg">Alex Johnson</h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                        Professional video editor specializing in documentaries and commercials with 5+ years experience
                      </p>
                    </div>
                    
                    {/* Skills */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {['Premiere Pro', 'Color Grading', 'Motion Graphics', 'Sound Design'].map((skill) => (
                        <span key={skill} className="rounded-full bg-slate-50 px-2 py-1 text-[0.68rem] font-medium text-slate-700 ring-1 ring-slate-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                    
                    {/* Button */}
                    <button className="mt-4 w-full rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 sm:w-auto">
                      Contact Me
                    </button>
                  </div>
                </m.div>

                {/* Card 2: Sumber Video Multi-platform */}
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-900/5 transition-shadow hover:shadow-lg hover:shadow-[#1a46c9]/10 sm:p-5"
                >
                  {/* Header */}
                  <div className="mb-3 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-[#1a46c9]" />
                    <h3 className="text-base font-bold text-slate-800">Import dari Mana Saja</h3>
                  </div>
                  
                  {/* Platform Icons */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { Icon: SiYoutube, color: '#FF0000', bg: '#FFE5E5', name: 'YouTube' },
                      { Icon: SiGoogledrive, color: '#4285F4', bg: '#E3F2FD', name: 'Drive' },
                      { Icon: SiInstagram, color: '#E4405F', bg: '#FCE4EC', name: 'Instagram' },
                      { Icon: SiFacebook, color: '#1877F2', bg: '#E3F2FD', name: 'Facebook' },
                      { Icon: SiVimeo, color: '#1AB7EA', bg: '#E1F5FE', name: 'Vimeo' },
                      { Icon: HardDrive, color: '#64748b', bg: '#f1f5f9', name: 'Others' },
                    ].map((platform) => (
                      <div
                        key={platform.name}
                        className="flex items-center justify-center aspect-square rounded-xl hover:scale-110 transition-transform cursor-pointer"
                        style={{ backgroundColor: platform.bg }}
                      >
                        <platform.Icon style={{ color: platform.color }} className="h-5 w-5" />
                      </div>
                    ))}
                  </div>
                </m.div>

                {/* Card 3: Kontrol Visibilitas */}
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-900/5 transition-shadow hover:shadow-lg hover:shadow-[#1a46c9]/10 sm:p-5"
                >
                  {/* Header */}
                  <div className="mb-3 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-[#1a46c9]" />
                    <h3 className="text-base font-bold text-slate-800">Kontrol Visibilitas</h3>
                  </div>
                  
                  {/* Status Options */}
                  <div className="space-y-2">
                    {[
                      { label: 'Draft', color: 'bg-slate-100 text-slate-600', icon: null, active: false },
                      { label: 'Private', color: 'bg-rose-50 text-rose-700', icon: Lock, active: false },
                      { label: 'Semi-Private', color: 'bg-amber-50 text-amber-700', icon: EyeOff, active: false },
                      { label: 'Public', color: 'bg-emerald-50 text-emerald-700', icon: Globe, active: true },
                    ].map((status) => (
                      <div
                        key={status.label}
                        className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 transition-all ${
                          status.active ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full ${status.color.split(' ')[0]}`} />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-800">{status.label}</p>
                        </div>
                        {status.icon && <status.icon className="h-3.5 w-3.5 text-slate-400" />}
                      </div>
                    ))}
                  </div>
                </m.div>

                {/* Card 4: Halaman Video Publik */}
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-900/5 transition-shadow hover:shadow-lg hover:shadow-[#1a46c9]/10 sm:col-span-2 sm:p-5 lg:col-span-1"
                >
                  {/* Header */}
                  <div className="mb-3">
                    <h3 className="text-base font-bold text-slate-800">Halaman Publik per Slug</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">Sajikan karyamu secara profesional dalam satu halaman.</p>
                  </div>
                  
                  {/* Browser Mockup */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    {/* Browser Bar */}
                    <div className="bg-slate-100 p-2 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      </div>
                      <div className="flex-1 bg-white rounded px-3 py-1.5 text-xs text-slate-600 truncate">
                        showreels.id/v/documentary-film
                      </div>
                    </div>
                    
                    {/* Video Thumbnail */}
                    <div className="relative aspect-video bg-gradient-to-br from-slate-100 via-white to-[#eef4ff]">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="group flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-zinc-900 transition-colors hover:bg-zinc-800">
                          <Play className="ml-0.5 h-5 w-5 text-white transition-transform group-hover:scale-110" fill="white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </m.div>
              </div>
            </div>
          </section>

          <section className="border-y border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 py-10 sm:py-12 lg:py-14">
            <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <Badge className={sectionBadgeClass}>
                  {dictionary.landingPlatformBadge}
                </Badge>
                <h2 className={sectionTitleClass}>
                  {dictionary.landingPlatformTitleLead}{" "}
                  <span className={accentTextClass}>{dictionary.landingPlatformTitleAccent}</span>
                </h2>
                <p className={cn(centeredSectionDescriptionClass, "max-w-[620px]")}>
                  {dictionary.landingPlatformDescription}
                </p>
              </div>

              <div className="mx-auto mt-8 grid max-w-[960px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
                {PLATFORM_SOURCES.map((platform, index) => {
                  const PlatformIcon = platform.icon;
                  const isHero = platform.name === "YouTube";
                  
                  return (
                    <m.article
                      key={platform.name}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.35, delay: index * 0.07 }}
                      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition-all hover:-translate-y-1 hover:border-slate-400 hover:shadow-lg ${
                        isHero ? "p-5 sm:col-span-2 lg:col-span-1 lg:row-span-2" : "p-4 sm:p-5"
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-transparent to-slate-100 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      
                      {isHero ? (
                        <div className="relative z-10 flex h-full min-h-[210px] flex-col items-center justify-center gap-4 text-center sm:min-h-[230px] lg:min-h-[260px]">
                          <div className="flex h-20 w-20 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 group-hover:scale-105" style={{ backgroundColor: platform.lightBg }}>
                            <PlatformIcon
                              className="h-10 w-10 transition-transform group-hover:scale-110"
                              style={{ color: platform.brandColor }}
                              aria-label={platform.name}
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold tracking-tight text-slate-800">{platform.name}</h3>
                            <p className="mx-auto mt-1 max-w-[14rem] text-xs leading-relaxed text-slate-500">
                              {locale === "en" ? "Publish and showcase your strongest video work." : "Tampilkan karya video terbaik dari channel utama kamu."}
                            </p>
                          </div>
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#eef4ff] px-3 py-1.5 text-[0.7rem] font-semibold text-[#1a46c9]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1a46c9]" />
                            {locale === "en" ? "Fully supported" : "Didukung Penuh"}
                          </div>
                        </div>
                      ) : (
                        <div className="relative z-10 flex min-h-[125px] flex-col items-center justify-center gap-3 text-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105" style={{ backgroundColor: platform.lightBg }}>
                            <PlatformIcon
                              className="h-7 w-7 transition-transform group-hover:scale-110"
                              style={{ color: platform.brandColor }}
                              aria-label={platform.name}
                            />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold tracking-tight text-slate-800">{platform.name}</h3>
                            <p className="mt-0.5 text-[0.7rem] font-medium text-slate-500">
                              {locale === "en" ? "Supported" : "Didukung"}
                            </p>
                          </div>
                        </div>
                      )}
                    </m.article>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-10 sm:py-12 lg:py-14">
            <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-slate-100 opacity-30 blur-3xl" />
            <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-slate-100 opacity-30 blur-3xl" />
            
            <div className="relative z-10 mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <Badge className={sectionBadgeClass}>
                  {dictionary.landingHowItWorksBadge}
                </Badge>
                <h2 className={sectionTitleClass}>
                  {dictionary.landingHowItWorksTitleLead}{" "}
                  <span className={accentTextClass}>
                    {dictionary.landingHowItWorksTitleAccent}
                  </span>
                </h2>
                <p className={centeredSectionDescriptionClass}>
                  {dictionary.landingHowItWorksDescription}
                </p>
              </div>

              <div className="relative mt-8 grid gap-5 lg:grid-cols-3 lg:gap-6">
              {[
                  {
                    label: dictionary.landingHowItWorksStep1Label,
                    title: dictionary.landingHowItWorksStep1Title,
                    description: dictionary.landingHowItWorksStep1Description,
                    icon: UserRound,
                  },
                  {
                    label: dictionary.landingHowItWorksStep2Label,
                    title: dictionary.landingHowItWorksStep2Title,
                    description: dictionary.landingHowItWorksStep2Description,
                    icon: PlayCircle,
                  },
                  {
                    label: dictionary.landingHowItWorksStep3Label,
                    title: dictionary.landingHowItWorksStep3Title,
                    description: dictionary.landingHowItWorksStep3Description,
                    icon: Check,
                  },
                ].map((step, index) => {
                  const StepIcon = step.icon;

                  return (
                    <m.article
                      key={step.label}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.4, delay: index * 0.15 }}
                      className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-wider text-white shadow-sm sm:px-3 sm:py-1.5">
                          {step.label}
                        </span>
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 sm:h-12 sm:w-12">
                          <StepIcon className="h-5 w-5 text-slate-600 sm:h-6 sm:w-6" strokeWidth={2} />
                        </div>
                      </div>

                      <div className="mx-auto my-4 flex h-20 w-full items-center justify-center sm:my-5 sm:h-24">
                        {index === 0 && (
                          <div className="flex flex-col items-center gap-3">
                            <div className="flex gap-2">
                              <div className="h-6 w-14 rounded-lg border border-slate-200 bg-gradient-to-r from-slate-100 to-slate-200" />
                              <div className="h-6 w-14 rounded-lg border border-zinc-900 bg-gradient-to-r from-zinc-900 to-zinc-700" />
                              <div className="h-6 w-14 rounded-lg border border-slate-200 bg-gradient-to-r from-slate-100 to-slate-200" />
                            </div>
                            <div className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-3 py-1.5 text-[0.7rem] font-semibold text-white">
                              <Check className="h-3 w-3" />
                              Subscribe
                            </div>
                          </div>
                        )}
                        {index === 1 && (
                          <div className="relative">
                            <div className="flex h-18 w-24 items-center justify-center rounded-xl border-2 border-dashed border-zinc-900 bg-gradient-to-br from-slate-50 to-slate-200">
                              <PlayCircle className="h-9 w-9 text-slate-700 opacity-40" />
                            </div>
                            <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 shadow-lg">
                              <Plus className="h-4 w-4 text-white" strokeWidth={3} />
                            </div>
                          </div>
                        )}
                        {index === 2 && (
                          <div className="relative">
                            <div className="h-20 w-28 rounded-xl border-2 border-slate-200 bg-white p-2.5 shadow-md">
                              <div className="mb-2 h-2 w-full rounded bg-slate-200" />
                              <div className="mb-2 h-2 w-3/4 rounded bg-slate-200" />
                              <div className="mb-3 h-2 w-5/6 rounded bg-slate-200" />
                              <div className="mb-1 h-1.5 w-full rounded bg-slate-200" />
                              <div className="h-1.5 w-2/3 rounded bg-slate-200" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
                              <Check className="h-5 w-5 text-white" strokeWidth={3} />
                            </div>
                          </div>
                        )}
                      </div>

                      <h3 className="mt-2 text-center text-[0.9375rem] font-bold tracking-tight text-slate-950 sm:mt-3 sm:text-[1rem]">
                        {step.title}
                      </h3>

                      <p className="mt-1.5 text-center text-[0.75rem] leading-relaxed text-slate-600 sm:mt-2 sm:text-[0.8125rem]">
                        {step.description}
                      </p>

                      {index < 2 && (
                        <div className="absolute -right-5 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
                          <svg className="h-7 w-7 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </m.article>
                  );
                })}
              </div>
            </div>
          </section>

          <section
            id="themes"
            className="scroll-mt-28 overflow-x-clip border-y border-slate-200 bg-slate-50 py-12 sm:py-16 lg:py-20"
          >
            <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <Badge className={sectionBadgeClass}>
                  {dictionary.landingThemesBadge}
                </Badge>
                <h2 className={sectionTitleClass}>
                  {dictionary.landingThemesTitleLead}{" "}
                  <span className={accentTextClass}>{dictionary.landingThemesTitleAccent}</span>
                </h2>
                <p className={centeredSectionDescriptionClass}>
                  {dictionary.landingThemesDescription}
                </p>
              </div>

              <div className="theme-marquee mt-7 px-0.5 sm:mt-8 sm:px-1">
                <div className="theme-marquee-track">
                  {[0, 1].map((loopIndex) => (
                    <div className="theme-marquee-group" key={`theme-loop-${loopIndex}`}>
                      {THEME_PREVIEWS.map((theme) => (
                        <PhonePreviewMockup
                          key={`${theme.name}-${loopIndex}`}
                          className="w-[206px] flex-none sm:w-[224px]"
                          gradientClassName={theme.bg}
                          name={theme.name}
                          handle={theme.handle.replace("@", "")}
                          avatarUrl={featuredCreators[0]?.image || ""}
                          avatarText={getThemeAvatarLetter(theme.name)}
                          rows={themeFeatureRows}
                          textTone={theme.textTone}
                          compact
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <a href="#pricing">
                  <Button
                    variant="secondary"
                    className="border-slate-200 text-slate-700 hover:bg-slate-100"
                  >
                    {dictionary.landingThemesCta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </section>

          <section
            id="pricing"
            className="scroll-mt-28 border-y border-slate-200 bg-slate-50 py-12 sm:py-16 lg:py-20"
          >
            <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <Badge className={sectionBadgeClass}>
                  {dictionary.landingPricingBadge}
                </Badge>
                <h2 className="mt-3 font-display text-section-display font-extrabold text-slate-950">
                  <span>{dictionary.landingPricingTitleLead}</span>{" "}
                  <span className={accentTextClass}>
                    {dictionary.landingPricingTitleAccent}
                  </span>
                </h2>
                <p className={centeredSectionDescriptionClass}>
                  {dictionary.landingPricingDescription}
                </p>
              </div>

              <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_20px_48px_-34px_rgba(25,42,74,0.28)] sm:p-7 lg:p-9">
                <div className="text-center">
                  <h3 className="font-display text-[clamp(1.45rem,3.2vw,2.25rem)] font-semibold tracking-[-0.03em] text-slate-950">
                    {locale === "en" ? "Pick a plan" : "Pilih paket"}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 sm:text-base">
                    {locale === "en"
                      ? "Free, Creator, or Business. Checkout is simple."
                      : "Free, Creator, atau Business. Checkout mudah."}
                  </p>
                </div>

                <div className="mt-7 grid gap-3.5 lg:grid-cols-3">
                  {pricingPlans.map((plan) => (
                    <Link
                      key={plan.name}
                      href={PRICING_PLAN_HREF_BY_ID[plan.id]}
                      className={cn(
                        "relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border p-5 transition hover:-translate-y-0.5 sm:p-6",
                        plan.featured
                          ? "border-[#1a46c9] bg-[#eef4ff] text-slate-950 shadow-sm"
                          : "border-slate-200 bg-white text-slate-950"
                      )}
                    >
                      {plan.featured ? (
                        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-[#dbe5ff] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1a46c9]">
                          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#1a46c9]" />
                          {locale === "en" ? "Most popular" : "Paling populer"}
                        </span>
                      ) : null}

                      <p className="text-helper font-semibold uppercase tracking-[0.14em] text-slate-500">
                        {plan.name}
                      </p>
                      <p className="mt-2.5 text-[2.05rem] font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.3rem]">
                        {plan.monthlyPrice}
                        <span className="ml-1 text-[0.84rem] font-medium tracking-[-0.006em] text-slate-500">
                          {locale === "en" ? "/month" : "/bulan"}
                        </span>
                      </p>
                      <p className="text-body-base mt-2 text-slate-600">{plan.subtitle}</p>
                    </Link>
                  ))}
                </div>

                <div className="mt-6 flex justify-center">
                  <Link href="/payment?plan=creator">
                    <Button className="!shadow-none bg-[#1a46c9] px-6 font-extrabold text-white hover:bg-[#153aa8]">
                      {locale === "en" ? "Choose plan & continue" : "Pilih paket & lanjutkan"}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[1160px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="text-center">
              <Badge className={sectionBadgeClass}>
                {dictionary.landingTestimonialsBadge}
              </Badge>
              <h2 className={sectionTitleClass}>
                {dictionary.landingTestimonialsTitleLead}{" "}
                <span className={accentTextClass}>
                  {dictionary.landingTestimonialsTitleAccent}
                </span>
              </h2>
              <p className={centeredSectionDescriptionClass}>
                {dictionary.landingTestimonialsDescription}
              </p>
            </div>

            <div className="mt-8 grid gap-3.5 lg:grid-cols-3">
              {marketingTestimonials.map((item) => (
                <article
                  key={item.name}
                  className={cn(
                    "rounded-[1.45rem] border p-5 sm:p-6",
                    item.light
                      ? "border-slate-200 bg-white text-slate-950"
                      : "border-zinc-800 bg-zinc-950 text-white"
                  )}
                >
                  <div className="mb-4 flex items-center gap-2" aria-label={`${item.rating} dari 5 bintang`}>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, index) => {
                        const active = index < item.rating;

                        return (
                          <Star
                            key={`${item.name}-star-${index}`}
                            className={cn(
                              "h-4 w-4",
                              active
                                ? "fill-amber-400 text-amber-400"
                                : item.light
                                  ? "fill-slate-200 text-slate-200"
                                  : "fill-white/18 text-white/18"
                            )}
                          />
                        );
                      })}
                    </div>
                    <span
                      className={cn(
                        "text-[0.78rem] font-semibold tracking-[-0.006em]",
                        item.light ? "text-slate-500" : "text-white/68"
                      )}
                    >
                      {item.rating}/5
                    </span>
                  </div>
                  <p
                    className={cn(
                      "text-body-base",
                      item.light ? "text-slate-700" : "text-white/90"
                    )}
                  >
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <div className="mt-5 flex items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold",
                        item.light
                          ? "bg-gradient-to-br from-slate-400 to-slate-700 text-white"
                          : "bg-gradient-to-br from-zinc-600 to-zinc-900 text-white"
                      )}
                    >
                      {item.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-card-title font-semibold">{item.name}</p>
                      <p
                        className={cn(
                          "text-helper",
                          item.light ? "text-slate-500" : "text-white/65"
                        )}
                      >
                        {item.role}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section
            id="faq"
            className="scroll-mt-28 border-y border-slate-200 bg-slate-50 py-12 sm:py-16 lg:py-20"
          >
            <div className="mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8">
              <div className="mx-auto w-full max-w-3xl">
                <div className="text-center">
                  <Badge className={sectionBadgeClass}>
                    {dictionary.landingFaqBadge}
                  </Badge>
                  <h2 className={sectionTitleClass}>
                    {dictionary.landingFaqTitleLead}{" "}
                    <span className={accentTextClass}>{dictionary.landingFaqTitleAccent}</span>
                  </h2>
                  <p className={centeredSectionDescriptionClass}>
                    {dictionary.landingFaqDescription}
                  </p>
                </div>

                <div className="mt-8 rounded-[1.45rem] border border-slate-200 bg-white px-5 sm:px-6">
                  {marketingFaqItems.map((item, index) => (
                    <LandingFaqItem
                      key={item.question}
                      question={item.question}
                      answer={item.answer}
                      open={openFaqIndex === index}
                      onToggle={() =>
                        setOpenFaqIndex((prev) => (prev === index ? -1 : index))
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-[1160px] px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[2.2rem] border border-zinc-800 bg-zinc-950 px-5 py-11 shadow-sm ring-1 ring-zinc-700/45 sm:px-8 sm:py-14 lg:px-14 lg:py-16">
              {!prefersReducedMotion ? (
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
              ) : null}
              <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(10,16,28,0.82),rgba(20,32,55,0.66),rgba(11,18,34,0.76))]" />

              <m.div
                className="pointer-events-none absolute -left-20 bottom-[-96px] hidden rotate-[-15deg] lg:block"
                animate={prefersReducedMotion ? undefined : { y: [0, 8, 0] }}
                transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <PhonePreviewMockup
                  className="w-[220px]"
                  gradientClassName="from-slate-200 to-slate-500"
                  name={locale === "en" ? "Public Profile" : "Profil Publik"}
                  handle={featuredCreators[0]?.username || "creator.demo"}
                  avatarUrl={featuredCreators[0]?.image || ""}
                  rows={previewPlatformRows.slice(0, 4)}
                  compact
                />
              </m.div>

              <m.div
                className="pointer-events-none absolute -right-16 top-[-84px] hidden rotate-[13deg] lg:block"
                animate={prefersReducedMotion ? undefined : { y: [0, -8, 0] }}
                transition={{
                  duration: 7.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.4,
                }}
              >
                <PhonePreviewMockup
                  className="w-[220px]"
                  gradientClassName="from-slate-200 to-zinc-500"
                  name={locale === "en" ? "Video Sources" : "Sumber Video"}
                  handle={featuredCreators[0]?.username || "creator.demo"}
                  avatarUrl={featuredCreators[0]?.image || ""}
                  rows={previewPlatformRows.slice(1, 5)}
                  compact
                />
              </m.div>

              <div className="relative z-10 mx-auto max-w-3xl text-center">
                <Badge className="rounded-full border border-slate-600 bg-zinc-900 px-3 py-1 text-eyebrow font-extrabold uppercase text-white shadow-sm">
                  {dictionary.landingFinalBadge}
                </Badge>
                <h2 className="mt-5 font-display text-[clamp(1.88rem,8.2vw,4rem)] font-extrabold leading-[1.08] tracking-[-0.036em] text-white sm:text-[clamp(2rem,4.5vw,4rem)]">
                  {dictionary.landingFinalTitleLead}{" "}
                  <span className="font-accent text-[#8da8ff]">
                    {dictionary.landingFinalTitleAccent}
                  </span>{" "}
                  {dictionary.landingFinalTitleTail}
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-body-lg text-white/90">
                  {dictionary.landingFinalDescription}
                </p>

                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/auth/signup" className="w-full sm:w-auto">
                    <Button className="w-full !shadow-none bg-[#1a46c9] px-6 font-extrabold text-white hover:bg-[#153aa8] sm:w-auto sm:min-w-[230px]">
                      {dictionary.landingFinalPrimaryCta}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/videos" className="w-full sm:w-auto">
                    <Button
                      variant="secondary"
                      className="w-full border-white/60 bg-white text-slate-800 hover:bg-slate-100 sm:w-auto sm:min-w-[182px]"
                    >
                      <PlayCircle className="h-4 w-4" />
                      {dictionary.landingFinalSecondaryCta}
                    </Button>
                  </Link>
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.95rem] text-white/90">
                  {[
                    dictionary.landingFinalPointFast,
                    dictionary.landingFinalPointFree,
                    dictionary.landingFinalPointFlexible,
                  ].map((point) => (
                    <p key={point} className="inline-flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {point}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-14 border-t border-slate-200 bg-slate-50">
          <div className="mx-auto grid w-full max-w-[1160px] gap-7 px-4 py-9 sm:px-6 lg:grid-cols-[1.1fr_0.7fr_0.7fr_0.7fr] lg:px-8">
            <div>
              <AppLogo />
              <p className="text-body-base mt-3 max-w-md text-slate-600">
                {locale === "en"
                  ? "showreels.id helps creators present their best work with clean, professional public pages."
                  : "showreels.id membantu creator menampilkan karya terbaik dengan halaman publik yang rapi dan profesional."}
              </p>
            </div>

            <div>
              <p className="text-[0.96rem] font-semibold tracking-[-0.01em] text-slate-950">
                Company
              </p>
              <div className="mt-3 space-y-2 text-[0.95rem] tracking-[-0.01em] text-slate-600">
                <Link href="/about" className="block transition hover:text-slate-950">
                  About
                </Link>
                <Link href="/auth/signup" className="block transition hover:text-slate-950">
                  Register Creator
                </Link>
                <Link href="/dashboard" className="block transition hover:text-slate-950">
                  Dashboard
                </Link>
              </div>
            </div>

            <div>
              <p className="text-[0.96rem] font-semibold tracking-[-0.01em] text-slate-950">
                Support
              </p>
              <div className="mt-3 space-y-2 text-[0.95rem] tracking-[-0.01em] text-slate-600">
                <Link
                  href="/customer-service"
                  className="block transition hover:text-slate-950"
                >
                  Customer Service
                </Link>
                <Link href="/auth/login" className="block transition hover:text-slate-950">
                  Login
                </Link>
              </div>
            </div>

            <div>
              <p className="text-[0.96rem] font-semibold tracking-[-0.01em] text-slate-950">
                Legal
              </p>
              <div className="mt-3 space-y-2 text-[0.95rem] tracking-[-0.01em] text-slate-600">
                <Link href="/legal" className="block transition hover:text-slate-950">
                  Legal
                </Link>
                <Link
                  href="/legal/syarat"
                  className="block transition hover:text-slate-950"
                >
                  Syarat
                </Link>
                <Link
                  href="/legal/privasi"
                  className="block transition hover:text-slate-950"
                >
                  Privasi
                </Link>
                <Link
                  href="/legal/cookies"
                  className="block transition hover:text-slate-950"
                >
                  Cookies
                </Link>
                <Link href="/legal/dpa" className="block transition hover:text-slate-950">
                  DPA
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200">
            <div className="mx-auto flex w-full max-w-[1160px] items-center justify-between gap-3 px-4 py-4 text-helper text-slate-500 sm:px-6 lg:px-8">
              <p>Copyright {year} showreels.id. All rights reserved.</p>
              <p className="hidden items-center gap-1 sm:inline-flex">
                <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                Creator-first platform
              </p>
            </div>
          </div>
        </footer>
      </div>
    </LazyMotion>
  );
}
