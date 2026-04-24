"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  LayoutGrid,
  List,
  LogOut,
  Menu,
  PlayCircle,
  Plus,
  X,
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { AvatarBadge } from "@/components/avatar-badge";
import { SitePreferences } from "@/components/site-preferences";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePreferences } from "@/hooks/use-preferences";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { getThumbnailCandidates } from "@/lib/video-utils";
import { getVideoSourceBadgeMeta } from "@/lib/video-source-badge";

const CREATOR_ROTATION_INTERVAL_MS = 5 * 60 * 1000;
const CREATOR_DEVICE_SEED_KEY = "showreels-featured-creator-seed-v2";

const THEME_PREVIEWS = [
  { name: "Coral", handle: "@creator.coral", bg: "from-[#f39d7a] to-[#f35540]" },
  { name: "Lavender", handle: "@creator.lavender", bg: "from-[#c5bde9] to-[#8b7bd6]" },
  { name: "Ocean", handle: "@creator.ocean", bg: "from-[#95c7e8] to-[#3283ba]" },
  { name: "Mono", handle: "@creator.mono", bg: "from-[#3f3f42] to-[#101011]" },
  { name: "Rose", handle: "@creator.rose", bg: "from-[#efbfd0] to-[#dc6693]" },
];

type UsernameStatus = "idle" | "checking" | "invalid" | "available" | "taken";

function createSeededHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle<T extends { id: string }>(items: T[], seed: string): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const hash = createSeededHash(`${seed}-${result[index].id}-${index}`);
    const swapIndex = hash % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
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
    <m.article layout className="border-b border-[#e6ddd8]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 py-5 text-left"
      >
        <span className="text-lg font-semibold text-[#1f1a17]">{question}</span>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#e0d5cf] bg-white text-[#70615a]">
          {open ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
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
            <p className="max-w-3xl pb-6 text-base leading-8 text-[#554a45]">{answer}</p>
          </m.div>
        ) : null}
      </AnimatePresence>
    </m.article>
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
  featuredVideos: Array<{
    id: string;
    title: string;
    publicSlug: string;
    description: string;
    createdAt: Date;
    sourceUrl: string;
    thumbnailUrl: string;
    outputType: string;
    durationLabel: string;
    author: {
      username: string | null;
      name: string | null;
      image: string | null;
    };
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
  featuredVideos,
  currentUser = null,
}: LandingPageProps) {
  const { dictionary, locale } = usePreferences();
  const supabase = createClient();
  const year = new Date().getFullYear();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [latestVideosView, setLatestVideosView] = useState<"grid" | "list">("grid");
  const [isDesktop, setIsDesktop] = useState(false);
  const [creatorDeviceSeed, setCreatorDeviceSeed] = useState("creator-seed-default");
  const [creatorTimeBucket, setCreatorTimeBucket] = useState(0);

  const [usernameInput, setUsernameInput] = useState("");
  const [usernameAsyncStatus, setUsernameAsyncStatus] = useState<
    Exclude<UsernameStatus, "invalid">
  >("idle");
  const [usernameSuggestion, setUsernameSuggestion] = useState("");

  const loginLabel = dictionary.login?.trim() || (locale === "en" ? "Login" : "Masuk");
  const signupLabel =
    dictionary.signup?.trim() || (locale === "en" ? "Sign up" : "Daftar");

  const sanitizedUsername = useMemo(
    () => sanitizeUsernameInput(usernameInput),
    [usernameInput]
  );

  useEffect(() => {
    const syncViewport = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncSeed = () => {
      const fromStorage = window.localStorage.getItem(CREATOR_DEVICE_SEED_KEY);
      if (fromStorage) {
        setCreatorDeviceSeed(fromStorage);
        return;
      }

      const nextSeed =
        window.crypto?.randomUUID?.() ||
        `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      window.localStorage.setItem(CREATOR_DEVICE_SEED_KEY, nextSeed);
      setCreatorDeviceSeed(nextSeed);
    };

    const timeout = window.setTimeout(syncSeed, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const rotate = () => {
      setCreatorTimeBucket(Math.floor(Date.now() / CREATOR_ROTATION_INTERVAL_MS));
    };

    const initialSync = window.setTimeout(rotate, 0);
    const timer = window.setInterval(rotate, CREATOR_ROTATION_INTERVAL_MS);
    return () => {
      window.clearTimeout(initialSync);
      window.clearInterval(timer);
    };
  }, []);

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

  const featuredCreatorCards = useMemo(() => {
    const creatorsWithBio = featuredCreators.filter(
      (creator) => creator.bio && creator.bio.trim().length > 0
    );
    const creatorsWithoutBio = featuredCreators.filter(
      (creator) => !creator.bio || creator.bio.trim().length === 0
    );

    const seedBase = `${creatorDeviceSeed}-${creatorTimeBucket}`;
    const shuffledWithBio = seededShuffle(creatorsWithBio, `${seedBase}-with-bio`);
    const shuffledWithoutBio = seededShuffle(
      creatorsWithoutBio,
      `${seedBase}-without-bio`
    );

    return [...shuffledWithBio, ...shuffledWithoutBio].slice(0, 6);
  }, [featuredCreators, creatorDeviceSeed, creatorTimeBucket]);

  const latestVideoRows = useMemo(() => featuredVideos.slice(0, 6), [featuredVideos]);
  const maxVisibleVideos = isDesktop ? 3 : 2;
  const visibleLatestVideos = useMemo(
    () => latestVideoRows.slice(0, maxVisibleVideos),
    [latestVideoRows, maxVisibleVideos]
  );

  const marketingFeatures = useMemo(
    () => [
      {
        title: locale === "en" ? "Link Stack Editor" : "Editor susunan link",
        description:
          locale === "en"
            ? "Arrange your custom links, socials, and highlight cards in minutes."
            : "Atur urutan custom link, social, dan kartu highlight dalam hitungan menit.",
      },
      {
        title: locale === "en" ? "Instant Publish" : "Publish instan",
        description:
          locale === "en"
            ? "Changes go live immediately without deploy delay."
            : "Perubahan langsung tayang tanpa deploy.",
      },
      {
        title: locale === "en" ? "Priority Links" : "Link prioritas",
        description:
          locale === "en"
            ? "Pin key links like media kit, booking, and store at the top."
            : "Pin link penting seperti media kit, booking, dan toko di bagian teratas.",
      },
      {
        title: locale === "en" ? "Deep Integrations" : "Integrasi lengkap",
        description:
          locale === "en"
            ? "Spotify, YouTube, TikTok, Calendly, and more."
            : "Spotify, YouTube, TikTok, Calendly, dan lainnya.",
      },
    ],
    [locale]
  );

  const marketingTestimonials = useMemo(
    () => [
      {
        quote:
          locale === "en"
            ? "I used to edit bio links every week. Now everything is in one place and cleaner."
            : "Dulu tiap nge-post aku harus update link berkali-kali. Sekarang semua ada di satu tempat.",
        name: "Rara Aurelia",
        role: locale === "en" ? "Illustrator & Content Creator" : "Illustrator & Content Creator",
        light: true,
      },
      {
        quote:
          locale === "en"
            ? "Analytics helps me spot which link works best so I can focus on what converts."
            : "Yang paling berguna itu analytics-nya. Jadi tahu link mana yang paling banyak diklik.",
        name: "Dio Pratama",
        role: locale === "en" ? "Podcaster & Creator" : "Podcaster & Kreator Konten",
        light: false,
      },
      {
        quote:
          locale === "en"
            ? "Setup took minutes. The page instantly looked professional for clients."
            : "Setup-nya cepat, tampilannya langsung kelihatan profesional tanpa perlu design dari nol.",
        name: "Maya Kusuma",
        role: locale === "en" ? "Digital Brand Owner" : "Pemilik Brand Digital",
        light: true,
      },
    ],
    [locale]
  );

  const marketingFaqItems = useMemo(
    () => [
      {
        question:
          locale === "en"
            ? "How is showreels.id different from competitors?"
            : "Apa bedanya showreels.id dengan kompetitor?",
        answer:
          locale === "en"
            ? "showreels.id is designed for Indonesian creators with local workflow, bilingual support, and a cleaner portfolio-focused experience."
            : "showreels.id dibuat khusus untuk creator Indonesia, dengan alur lokal, dukungan bilingual, dan pengalaman yang lebih fokus ke portfolio.",
      },
      {
        question: locale === "en" ? "Can I try it for free?" : "Bisakah saya coba gratis?",
        answer:
          locale === "en"
            ? "Yes. You can start from the free plan and upgrade when your audience grows."
            : "Bisa. Kamu bisa mulai dari paket gratis lalu upgrade saat kebutuhan berkembang.",
      },
      {
        question: locale === "en" ? "Is my data secure?" : "Data saya aman?",
        answer:
          locale === "en"
            ? "We run modern authentication flow and privacy controls so creators can choose public, semi-private, or private visibility."
            : "Kami memakai alur autentikasi modern dan kontrol privasi agar creator bisa memilih mode public, semi-private, atau private.",
      },
      {
        question:
          locale === "en"
            ? "How do I migrate from another platform?"
            : "Bagaimana cara pindah dari platform lain?",
        answer:
          locale === "en"
            ? "Paste your existing links, choose a theme, and publish. No coding migration is required."
            : "Cukup paste link lama kamu, pilih tema, lalu publish. Tidak perlu migrasi teknis yang rumit.",
      },
      {
        question:
          locale === "en"
            ? "Can I use my own domain?"
            : "Bisakah pakai domain sendiri?",
        answer:
          locale === "en"
            ? "Yes, custom domain support is available for premium plans."
            : "Bisa, dukungan custom domain tersedia pada paket premium.",
      },
    ],
    [locale]
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

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="min-h-screen bg-canvas text-[#201b18]">
        <header className="sticky top-0 z-40 border-b border-[#e2d9d3] bg-[#f7f4f1]/95 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <AppLogo />

            <nav className="hidden items-center gap-8 text-[1.04rem] font-medium text-[#4f433d] lg:flex">
              <a href="#features" className="transition hover:text-[#1f1a17]">
                {dictionary.landingNavFeatures}
              </a>
              <a href="#themes" className="transition hover:text-[#1f1a17]">
                {dictionary.landingNavThemes}
              </a>
              <a href="#pricing" className="transition hover:text-[#1f1a17]">
                {dictionary.landingNavPricing}
              </a>
              <a href="#faq" className="transition hover:text-[#1f1a17]">
                {dictionary.landingNavFaq}
              </a>
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <SitePreferences compact />
              {currentUser ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="secondary">Dashboard</Button>
                  </Link>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#ddd3cd] bg-white px-2.5 py-1.5">
                    <AvatarBadge
                      name={currentUser.name || "Creator"}
                      avatarUrl={currentUser.image || ""}
                      size="sm"
                    />
                    <span className="pr-1 text-sm font-semibold text-[#3e3530]">
                      @{currentUser.username || "creator"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.replace("/");
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-[1.04rem] font-semibold text-[#3f3530]">
                    {loginLabel}
                  </Link>
                  <Link href="/auth/signup">
                    <Button>{dictionary.landingClaimCta}</Button>
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#ddd3cd] bg-white text-[#2d2623] lg:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </header>

        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-50 bg-[#120e0c]/40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 h-full w-full cursor-default"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu backdrop"
            />
            <aside className="absolute right-0 top-0 h-full w-[86%] max-w-[360px] border-l border-[#ddd3cd] bg-[#f8f5f2] p-5 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <AppLogo />
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#ddd3cd] bg-white text-[#2d2623]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-2 pb-4">
                <a
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm font-semibold text-[#3c322d] hover:bg-white"
                >
                  {dictionary.landingNavFeatures}
                </a>
                <a
                  href="#themes"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm font-semibold text-[#3c322d] hover:bg-white"
                >
                  {dictionary.landingNavThemes}
                </a>
                <a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm font-semibold text-[#3c322d] hover:bg-white"
                >
                  {dictionary.landingNavPricing}
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-xl px-3 py-2 text-sm font-semibold text-[#3c322d] hover:bg-white"
                >
                  {dictionary.landingNavFaq}
                </a>
              </div>

              <div className="border-t border-[#e2d9d3] pt-4">
                <SitePreferences />
                <div className="mt-4 space-y-2">
                  {currentUser ? (
                    <>
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="secondary" className="w-full">
                          Dashboard
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="w-full"
                        onClick={async () => {
                          await supabase.auth.signOut();
                          window.location.replace("/");
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="secondary" className="w-full">
                          {loginLabel}
                        </Button>
                      </Link>
                      <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                        <Button className="w-full">{dictionary.landingClaimCta}</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </aside>
          </div>
        ) : null}

        <main className="pb-16">
          <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-16 sm:px-6 lg:pb-24 lg:pt-20">
            <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="max-w-2xl">
                <Badge className="rounded-full border border-[#ecd8d2] bg-[#f9e4df] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#eb5a44] shadow-none">
                  {dictionary.landingHeroBadge}
                </Badge>
                <h1 className="mt-5 text-5xl font-bold leading-[1.04] tracking-[-0.03em] text-[#140f0d] sm:text-6xl">
                  {dictionary.landingHeroTitleLead}
                  <span className="mt-1 block font-accent text-[1.15em] text-[#eb5944]">
                    {dictionary.landingHeroTitleAccent}
                  </span>
                </h1>
                <p className="mt-6 text-xl leading-10 text-[#3f3733]">
                  {dictionary.landingHeroDescription}
                </p>

                <form
                  className="mt-8 max-w-xl rounded-[1.25rem] border border-[#e1d5cf] bg-white p-2 shadow-[0_18px_34px_rgba(29,23,20,0.08)]"
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
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label className="inline-flex items-center px-3 text-lg text-[#84756d]">
                      showreels.id/
                    </label>
                    <Input
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
                      className="h-12 border-none bg-[#f8f4f1] text-[1.04rem] focus:ring-[#f0c3b8]"
                    />
                    <Button
                      type="submit"
                      className="h-12 min-w-[120px] bg-[#ef5f49] hover:bg-[#e34f39]"
                      disabled={usernameStatus !== "available"}
                    >
                      {dictionary.landingHeroInputAction}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
                <p
                  className={cn(
                    "mt-3 text-sm",
                    usernameStatus === "available"
                      ? "text-emerald-700"
                      : usernameStatus === "taken" || usernameStatus === "invalid"
                        ? "text-rose-600"
                        : "text-[#6f625b]"
                  )}
                >
                  {statusLabel}
                  {usernameStatus === "taken" && usernameSuggestion
                    ? ` (${locale === "en" ? "Try" : "Coba"} @${usernameSuggestion})`
                    : ""}
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3 text-sm text-[#453b35]">
                  <div className="flex -space-x-2">
                    {featuredCreators.slice(0, 4).map((creator) => (
                      <AvatarBadge
                        key={creator.id}
                        name={creator.name || "Creator"}
                        avatarUrl={creator.image || ""}
                        size="sm"
                      />
                    ))}
                  </div>
                  <p>
                    {creatorCount.toLocaleString(locale === "en" ? "en-US" : "id-ID")}{" "}
                    {locale === "en" ? "creators are active today" : "creator aktif hari ini"}
                  </p>
                  <span className="hidden h-1 w-1 rounded-full bg-[#c8bbb4] sm:inline-flex" />
                  <p>
                    {videoCount.toLocaleString(locale === "en" ? "en-US" : "id-ID")}{" "}
                    {locale === "en" ? "videos published" : "video dipublish"}
                  </p>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-[420px]">
                <div className="relative rounded-[2.7rem] border-[8px] border-[#12100e] bg-gradient-to-b from-[#f6ac86] to-[#f35642] px-5 pb-7 pt-10 shadow-[0_28px_56px_rgba(17,13,11,0.28)]">
                  <div className="absolute left-1/2 top-3 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
                  <div className="mx-auto h-20 w-20 rounded-full border-4 border-white/40 bg-white/85" />
                  <p className="mt-4 text-center text-3xl font-semibold text-[#1f1a17]">
                    {featuredCreators[0]?.name || "Creator Demo"}
                  </p>
                  <p className="text-center text-base text-[#5f4f48]">
                    @{featuredCreators[0]?.username || "creator.demo"}
                  </p>
                  <div className="mt-6 space-y-3">
                    {[
                      locale === "en" ? "Instagram" : "Instagram",
                      locale === "en" ? "Latest on YouTube" : "Latest on YouTube",
                      locale === "en" ? "Podcast This Week" : "Podcast Minggu Ini",
                      locale === "en" ? "Business Contact" : "Kerja sama & email",
                      "TikTok",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center justify-between rounded-2xl bg-white/92 px-4 py-3 text-[#2a2320]"
                      >
                        <span className="text-sm font-semibold">{item}</span>
                        <span className="rounded-full bg-[#f2ebe7] px-2 py-0.5 text-xs text-[#7d6f67]">
                          48K
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute -left-18 top-16 rounded-2xl border border-[#e7dbd4] bg-white px-4 py-3 text-sm shadow-lg">
                  <p className="text-[#80726a]">{locale === "en" ? "CTR this week" : "CTR minggu ini"}</p>
                  <p className="text-xl font-semibold text-[#1f1a17]">12.4%</p>
                </div>
                <div className="absolute -right-16 bottom-16 rounded-2xl border border-[#e7dbd4] bg-white px-4 py-3 text-sm shadow-lg">
                  <p className="text-[#80726a]">Live</p>
                  <p className="text-xl font-semibold text-[#1f1a17]">+142 click</p>
                </div>
              </div>
            </div>
          </section>

          <section id="themes" className="border-y border-[#e3dbd6] bg-[#f7f4f1] py-16 sm:py-20">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
              <div className="text-center">
                <Badge className="rounded-full border border-[#f1d4cd] bg-[#fde8e2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#eb5a44] shadow-none">
                  {dictionary.landingThemesBadge}
                </Badge>
                <h2 className="mt-4 text-4xl font-bold tracking-[-0.03em] text-[#140f0d] sm:text-6xl">
                  {dictionary.landingThemesTitleLead}{" "}
                  <span className="font-accent text-[#eb5944]">
                    {dictionary.landingThemesTitleAccent}
                  </span>
                </h2>
                <p className="mx-auto mt-5 max-w-3xl text-xl leading-9 text-[#4c403a]">
                  {dictionary.landingThemesDescription}
                </p>
              </div>

              <div className="mt-10 flex snap-x gap-5 overflow-x-auto pb-3">
                {THEME_PREVIEWS.map((theme, index) => (
                  <m.article
                    key={theme.name}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.45 }}
                    transition={{ delay: index * 0.05, duration: 0.22 }}
                    className={cn(
                      "min-w-[235px] snap-start rounded-[2rem] border-[6px] border-[#12100e] bg-gradient-to-b p-4 pb-6 shadow-lg",
                      theme.bg
                    )}
                  >
                    <div className="mx-auto mb-5 h-3 w-20 rounded-full bg-black" />
                    <div className="mx-auto h-14 w-14 rounded-full border-2 border-white/50 bg-white/90" />
                    <p className="mt-2 text-center text-xl font-semibold text-[#1f1a17]">
                      {theme.name}
                    </p>
                    <p className="mb-4 text-center text-xs text-[#6b5d56]">{theme.handle}</p>
                    <div className="space-y-2">
                      {["Instagram", "YouTube", "Podcast", "Contact"].map((item) => (
                        <div
                          key={item}
                          className="rounded-xl bg-white/92 px-3 py-2 text-sm font-medium text-[#1e1916]"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </m.article>
                ))}
              </div>

              <div className="mt-8 flex justify-center">
                <a href="#pricing">
                  <Button variant="secondary">
                    {dictionary.landingThemesCta}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </section>

          <section id="features" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.8fr]">
              <div>
                <Badge className="rounded-full border border-[#f1d4cd] bg-[#fde8e2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#eb5a44] shadow-none">
                  {dictionary.landingFeaturesBadge}
                </Badge>
                <h2 className="mt-4 text-4xl font-bold tracking-[-0.03em] text-[#140f0d] sm:text-6xl">
                  {dictionary.landingFeaturesTitleLead}{" "}
                  <span className="font-accent text-[#eb5944]">
                    {dictionary.landingFeaturesTitleAccent}
                  </span>
                </h2>
                <p className="mt-5 max-w-3xl text-xl leading-9 text-[#4c403a]">
                  {dictionary.landingFeaturesDescription}
                </p>

                <div className="mt-8 space-y-5">
                  {marketingFeatures.map((item) => (
                    <article key={item.title} className="flex gap-4">
                      <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#fce8e2] text-[#e7543f]">
                        <Check className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-[1.52rem] font-semibold text-[#1d1714]">{item.title}</h3>
                        <p className="mt-1 text-lg text-[#5c514b]">{item.description}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="mx-auto w-full max-w-[360px] rounded-[2.5rem] border-[8px] border-[#12100e] bg-gradient-to-b from-[#c8bfe9] to-[#8b7ad5] p-5 pb-7 shadow-[0_30px_62px_rgba(30,23,20,0.24)]">
                <div className="mx-auto mb-5 h-5 w-24 rounded-full bg-black" />
                <div className="mx-auto h-20 w-20 rounded-full border-4 border-white/40 bg-white/90" />
                <p className="mt-4 text-center text-3xl font-semibold text-[#1f1a17]">Dio Pratama</p>
                <p className="text-center text-base text-[#5e4f73]">@dio.musik</p>
                <div className="mt-6 space-y-3">
                  {["Instagram", "Latest on YouTube", "Podcast Minggu Ini", "Kerja sama", "TikTok"].map((item) => (
                    <div key={item} className="rounded-2xl bg-white/92 px-4 py-3 text-sm font-semibold text-[#272127]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="pricing" className="border-y border-[#e3dbd6] bg-[#f7f4f1] py-16 sm:py-20">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
              <div className="text-center">
                <Badge className="rounded-full border border-[#f1d4cd] bg-[#fde8e2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#eb5a44] shadow-none">
                  {dictionary.landingPricingBadge}
                </Badge>
                <h2 className="mt-4 text-4xl font-bold tracking-[-0.03em] text-[#140f0d] sm:text-6xl">
                  {dictionary.landingPricingTitleLead}{" "}
                  <span className="font-accent text-[#eb5944]">
                    {dictionary.landingPricingTitleAccent}
                  </span>
                </h2>
                <p className="mx-auto mt-5 max-w-3xl text-xl leading-9 text-[#4c403a]">
                  {dictionary.landingPricingDescription}
                </p>
              </div>

              <div className="mt-10 grid gap-4 lg:grid-cols-3">
                {[
                  {
                    name: "Free",
                    price: "Rp0",
                    subtitle: dictionary.landingPricingFree,
                    points: [
                      locale === "en" ? "Basic profile blocks" : "Blok profil dasar",
                      locale === "en" ? "3 custom links" : "3 custom link",
                      locale === "en" ? "showreels subdomain" : "Subdomain showreels",
                    ],
                    featured: false,
                  },
                  {
                    name: "Pro",
                    price: "Rp49k",
                    subtitle: dictionary.landingPricingPro,
                    points: [
                      locale === "en" ? "Unlimited links" : "Link tanpa batas",
                      locale === "en" ? "Weekly analytics" : "Analytics mingguan",
                      locale === "en" ? "Theme customization" : "Custom tema",
                    ],
                    featured: true,
                  },
                  {
                    name: "Team",
                    price: "Rp149k",
                    subtitle: dictionary.landingPricingTeam,
                    points: [
                      locale === "en" ? "Multi-member workspace" : "Workspace multi-member",
                      locale === "en" ? "Priority support" : "Priority support",
                      locale === "en" ? "Custom domain + brand kit" : "Custom domain + brand kit",
                    ],
                    featured: false,
                  },
                ].map((plan) => (
                  <article
                    key={plan.name}
                    className={cn(
                      "rounded-[1.6rem] border p-6 shadow-sm",
                      plan.featured
                        ? "border-[#1f1a17] bg-[#1a1412] text-white"
                        : "border-[#ddd3cd] bg-white text-[#201b18]"
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm font-semibold uppercase tracking-[0.14em]",
                        plan.featured ? "text-[#f8c8bc]" : "text-[#8b7d75]"
                      )}
                    >
                      {plan.name}
                    </p>
                    <p className="mt-2 text-5xl font-bold tracking-[-0.03em]">
                      {plan.price}
                      <span className={cn("ml-1 text-base font-medium", plan.featured ? "text-white/70" : "text-[#776860]")}>
                        /bulan
                      </span>
                    </p>
                    <p className={cn("mt-2 text-sm", plan.featured ? "text-white/80" : "text-[#60524b]")}>
                      {plan.subtitle}
                    </p>

                    <ul className="mt-5 space-y-3">
                      {plan.points.map((point) => (
                        <li key={point} className="flex items-center gap-2 text-sm">
                          <span
                            className={cn(
                              "inline-flex h-5 w-5 items-center justify-center rounded-full",
                              plan.featured ? "bg-white/20" : "bg-[#fce7e1] text-[#e65440]"
                            )}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          {point}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6">
                      <Link href="/auth/signup">
                        <Button
                          className={cn(
                            "w-full",
                            plan.featured
                              ? "bg-white text-[#1a1412] hover:bg-[#f4efeb]"
                              : "bg-[#1a1412] text-white hover:bg-[#2a211d]"
                          )}
                        >
                          {locale === "en" ? "Choose plan" : "Pilih paket"}
                        </Button>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="text-center">
              <Badge className="rounded-full border border-[#f1d4cd] bg-[#fde8e2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#eb5a44] shadow-none">
                {dictionary.landingTestimonialsBadge}
              </Badge>
              <h2 className="mt-4 text-4xl font-bold tracking-[-0.03em] text-[#140f0d] sm:text-6xl">
                {dictionary.landingTestimonialsTitleLead}{" "}
                <span className="font-accent text-[#eb5944]">
                  {dictionary.landingTestimonialsTitleAccent}
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-3xl text-xl leading-9 text-[#4c403a]">
                {dictionary.landingTestimonialsDescription}
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {marketingTestimonials.map((item) => (
                <article
                  key={item.name}
                  className={cn(
                    "rounded-[1.6rem] border p-6",
                    item.light
                      ? "border-[#ddd3cd] bg-white text-[#221c19]"
                      : "border-[#1f1917] bg-[#181210] text-white"
                  )}
                >
                  <p className={cn("text-lg leading-9", item.light ? "text-[#332b27]" : "text-white/90")}>
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <span
                      className={cn(
                        "inline-flex h-11 w-11 items-center justify-center rounded-full text-base font-semibold",
                        item.light
                          ? "bg-gradient-to-br from-[#f1ab96] to-[#eb5e47] text-white"
                          : "bg-gradient-to-br from-[#8c7ad4] to-[#3c2e86] text-white"
                      )}
                    >
                      {item.name.charAt(0)}
                    </span>
                    <div>
                      <p className="text-lg font-semibold">{item.name}</p>
                      <p className={cn("text-sm", item.light ? "text-[#776860]" : "text-white/65")}>
                        {item.role}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="faq" className="border-y border-[#e3dbd6] bg-[#f7f4f1] py-16 sm:py-20">
            <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
              <div className="text-center">
                <Badge className="rounded-full border border-[#f1d4cd] bg-[#fde8e2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#eb5a44] shadow-none">
                  {dictionary.landingFaqBadge}
                </Badge>
                <h2 className="mt-4 text-4xl font-bold tracking-[-0.03em] text-[#140f0d] sm:text-6xl">
                  {dictionary.landingFaqTitleLead}{" "}
                  <span className="font-accent text-[#eb5944]">
                    {dictionary.landingFaqTitleAccent}
                  </span>
                </h2>
                <p className="mx-auto mt-5 max-w-3xl text-xl leading-9 text-[#4c403a]">
                  {dictionary.landingFaqDescription}
                </p>
              </div>

              <div className="mt-10 rounded-[1.6rem] border border-[#ddd3cd] bg-white px-6 sm:px-8">
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
          </section>

          <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7c6e66]">
                Community
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-[-0.02em] text-[#1b1512] sm:text-4xl">
                {locale === "en" ? "Featured creators" : "Creator pilihan"}
              </h2>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCreatorCards.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#d8cdc6] bg-white p-8 text-center text-sm text-[#6d6159] sm:col-span-2 lg:col-span-3">
                  {locale === "en" ? "No creators yet." : "Belum ada creator."}
                </p>
              ) : (
                featuredCreatorCards.map((creator) => (
                  <Link
                    key={creator.id}
                    href={creator.username ? `/creator/${creator.username}` : "/auth/signup"}
                    className="surface-panel rounded-[1.3rem] p-4 transition hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3">
                      <AvatarBadge
                        name={creator.name || "Creator"}
                        avatarUrl={creator.image || ""}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-[#201b18]">
                          {creator.name || "Creator"}
                        </p>
                        <p className="truncate text-sm text-[#7a6c64]">
                          @{creator.username || "creator"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-7 text-[#5e524b]">
                      {creator.bio?.trim() ||
                        (locale === "en"
                          ? "Bio has not been added yet."
                          : "Bio belum ditambahkan.")}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-3xl font-bold tracking-[-0.02em] text-[#1b1512] sm:text-4xl">
                {locale === "en"
                  ? "Latest videos from creators"
                  : "Video terbaru dari creator"}
              </h2>
              <div className="inline-flex items-center gap-1 rounded-full border border-[#d8cdc6] bg-white p-1">
                <button
                  type="button"
                  onClick={() => setLatestVideosView("grid")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition",
                    latestVideosView === "grid"
                      ? "bg-[#1a1412] text-white"
                      : "text-[#5d5049] hover:bg-[#f3ece7]"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setLatestVideosView("list")}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition",
                    latestVideosView === "list"
                      ? "bg-[#1a1412] text-white"
                      : "text-[#5d5049] hover:bg-[#f3ece7]"
                  )}
                >
                  <List className="h-4 w-4" />
                  List
                </button>
              </div>
            </div>

            <div
              className={cn(
                "mt-5",
                latestVideosView === "grid"
                  ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
                  : "space-y-4"
              )}
            >
              {visibleLatestVideos.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#d8cdc6] bg-white p-8 text-center text-sm text-[#6d6159]">
                  {locale === "en" ? "No video yet." : "Belum ada video."}
                </p>
              ) : (
                visibleLatestVideos.map((video) => {
                  const thumbnail =
                    getThumbnailCandidates(video.sourceUrl, video.thumbnailUrl)[0] || "";
                  const sourceMeta = getVideoSourceBadgeMeta(video.sourceUrl);
                  const postedDateLabel = new Intl.DateTimeFormat(
                    locale === "en" ? "en-US" : "id-ID",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  ).format(new Date(video.createdAt));

                  return (
                    <Link
                      key={video.id}
                      href={`/v/${video.publicSlug}`}
                      className={cn(
                        "group surface-panel overflow-hidden rounded-[1.3rem] p-4 transition hover:-translate-y-0.5",
                        latestVideosView === "list"
                          ? "grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]"
                          : "flex h-full flex-col"
                      )}
                    >
                      <div className="overflow-hidden rounded-xl bg-[#efe7e3]">
                        {thumbnail ? (
                          <Image
                            src={thumbnail}
                            alt={`Thumbnail ${video.title}`}
                            width={440}
                            height={248}
                            className="aspect-video h-full w-full object-cover"
                            unoptimized
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex aspect-video items-center justify-center text-sm font-medium text-[#6f625a]">
                            <span className="inline-flex items-center gap-1">
                              <PlayCircle className="h-4 w-4 text-[#ef5f49]" />
                              Video
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex min-w-0 flex-1 flex-col gap-2 sm:mt-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-2 text-sm font-semibold text-[#1f1a17] sm:text-base">
                            {video.title}
                          </p>
                          <span
                            className={cn(
                              "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs",
                              sourceMeta.className
                            )}
                          >
                            {sourceMeta.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <AvatarBadge
                            name={video.author?.name || "Creator"}
                            avatarUrl={video.author?.image || ""}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#4a3d37]">
                              {video.author?.name || "Creator"}
                            </p>
                            <p className="truncate text-xs text-[#7d6e66]">
                              @{video.author?.username || "creator"}
                            </p>
                          </div>
                        </div>

                        <p className="line-clamp-2 text-sm leading-7 text-[#5f524b]">
                          {video.description}
                        </p>

                        <div className="mt-auto flex items-center justify-between border-t border-[#e7ddd7] pt-2 text-xs text-[#6f625a]">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded-full bg-[#f5eeea] px-2 py-0.5">
                              {video.durationLabel || "-"}
                            </span>
                            <span className="rounded-full bg-[#f5eeea] px-2 py-0.5">
                              {video.outputType || "-"}
                            </span>
                          </div>
                          <span>{postedDateLabel}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            <div className="mt-5">
              <Link href="/videos">
                <Button variant="secondary">
                  {locale === "en" ? "View all videos" : "Lihat semua video"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </section>

          <section className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <div className="rounded-[1.8rem] border border-[#ddd3cd] bg-white p-7 text-[#1f1a17] shadow-[0_26px_60px_rgba(28,22,19,0.1)] sm:p-9">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7f726a]">
                    Ready
                  </p>
                  <h2 className="mt-2 text-3xl font-bold tracking-[-0.03em] sm:text-5xl">
                    {locale === "en"
                      ? "Build your creator page today."
                      : "Bangun halaman creatormu hari ini."}
                  </h2>
                </div>
                <Link href="/auth/signup">
                  <Button>
                    {signupLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-16 border-t border-[#e0d7d1] bg-[#f6f2ef]">
          <div className="mx-auto grid w-full max-w-7xl gap-7 px-4 py-9 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div>
              <AppLogo />
              <p className="mt-3 max-w-md text-sm leading-7 text-[#5f524b]">
                {locale === "en"
                  ? "showreels.id helps creators present their best work with clean, client-ready public pages."
                  : "showreels.id membantu creator menampilkan karya terbaik dengan halaman publik yang rapi dan siap dilihat klien."}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#211b17]">Company</p>
              <div className="mt-3 space-y-2 text-sm text-[#5f524b]">
                <Link href="/about" className="block transition hover:text-[#1e1814]">
                  About
                </Link>
                <Link href="/auth/signup" className="block transition hover:text-[#1e1814]">
                  Register Creator
                </Link>
                <Link href="/dashboard" className="block transition hover:text-[#1e1814]">
                  Dashboard
                </Link>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#211b17]">Support</p>
              <div className="mt-3 space-y-2 text-sm text-[#5f524b]">
                <Link
                  href="/customer-service"
                  className="block transition hover:text-[#1e1814]"
                >
                  Customer Service
                </Link>
                <Link href="/auth/login" className="block transition hover:text-[#1e1814]">
                  Login
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-[#e4dbd5]">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 text-sm text-[#7d6f67] sm:px-6">
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
