"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronDown,
  CircleCheckBig,
  CircleHelp,
  LayoutGrid,
  List,
  LogOut,
  Menu,
  PlayCircle,
  Sparkles,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import { FaFacebook, FaGoogleDrive, FaInstagram, FaVimeoV, FaYoutube } from "react-icons/fa";
import { AppLogo } from "@/components/app-logo";
import { AvatarBadge } from "@/components/avatar-badge";
import { SitePreferences } from "@/components/site-preferences";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/hooks/use-preferences";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import { getThumbnailCandidates } from "@/lib/video-utils";
import { getVideoSourceBadgeMeta } from "@/lib/video-source-badge";

const CREATOR_ROTATION_INTERVAL_MS = 5 * 60 * 1000;
const CREATOR_DEVICE_SEED_KEY = "showreels-featured-creator-seed-v1";

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

function AnimatedBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <m.div
        className="absolute left-[-6%] top-24 h-64 w-64 rounded-full bg-brand-200/45 blur-3xl"
        animate={{ x: [0, 42, 0], y: [0, -24, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <m.div
        className="absolute right-[-4%] top-[24%] h-72 w-72 rounded-full bg-sky-200/35 blur-3xl"
        animate={{ x: [0, -34, 0], y: [0, 36, 0], scale: [1.04, 0.96, 1.04] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <m.div
        className="absolute left-[28%] top-[58%] h-56 w-56 rounded-full bg-indigo-100/45 blur-3xl"
        animate={{ x: [0, 20, -8, 0], y: [0, -18, 24, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-x-0 top-0 h-full bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(255,255,255,0.86)_24%,rgba(255,255,255,0.97)_100%)]" />
    </div>
  );
}

function FaqItem({
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
    <m.div
      layout
      className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-slate-900 sm:text-base">{question}</span>
        <m.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </m.span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{answer}</p>
          </m.div>
        ) : null}
      </AnimatePresence>
    </m.div>
  );
}

export function LandingPage({
  featuredCreators,
  featuredVideos,
  currentUser = null,
}: LandingPageProps) {
  const { dictionary, locale } = usePreferences();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerSolid, setHeaderSolid] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [creatorDeviceSeed, setCreatorDeviceSeed] = useState("creator-seed-default");
  const [creatorTimeBucket, setCreatorTimeBucket] = useState(0);
  const [latestVideosView, setLatestVideosView] = useState<"grid" | "list">("grid");
  const [isDesktop, setIsDesktop] = useState(false);
  const supabase = createClient();
  const year = new Date().getFullYear();

  const loginLabel =
    dictionary.login?.trim() || (locale === "en" ? "Login" : "Masuk");
  const signupLabel =
    dictionary.signup?.trim() || (locale === "en" ? "Sign up" : "Daftar");

  const features = [
    {
      icon: Users,
      title: locale === "en" ? "Creator Identity" : "Identitas Creator",
      description:
        locale === "en"
          ? "Build one clean profile that feels client-ready from the first click."
          : "Bangun satu profil yang rapi dan terasa siap dipakai klien sejak klik pertama.",
    },
    {
      icon: UploadCloud,
      title: locale === "en" ? "Quick Submit" : "Submit Cepat",
      description:
        locale === "en"
          ? "Upload, manage status, and publish your best videos with less friction."
          : "Upload, atur status, lalu publish video terbaikmu dengan alur yang lebih ringan.",
    },
    {
      icon: LayoutGrid,
      title: locale === "en" ? "Smart Dashboard" : "Dashboard Cerdas",
      description:
        locale === "en"
          ? "Keep links, visibility, and portfolio order in one focused workspace."
          : "Kelola link, visibilitas, dan urutan portfolio dalam satu workspace yang fokus.",
    },
    {
      icon: BriefcaseBusiness,
      title: locale === "en" ? "Client Ready" : "Siap untuk Klien",
      description:
        locale === "en"
          ? "Professional public pages that help your work look more premium."
          : "Halaman publik profesional yang membuat karya kamu tampil lebih premium.",
    },
  ];

  const faqItems = [
    {
      question:
        locale === "en"
          ? "Can I publish videos from multiple platforms?"
          : "Apakah saya bisa publish video dari beberapa platform?",
      answer:
        locale === "en"
          ? "Yes. You can showcase videos from YouTube, Google Drive, Instagram, Facebook, and Vimeo in one creator profile."
          : "Bisa. Kamu dapat menampilkan video dari YouTube, Google Drive, Instagram, Facebook, dan Vimeo dalam satu profil creator.",
    },
    {
      question:
        locale === "en"
          ? "Can I save videos as draft or private first?"
          : "Apakah video bisa disimpan sebagai draft atau private dulu?",
      answer:
        locale === "en"
          ? "Yes. Each video can be managed as draft, private, or public before you share it to clients."
          : "Bisa. Setiap video dapat diatur sebagai draft, private, atau public sebelum kamu bagikan ke klien.",
    },
    {
      question:
        locale === "en"
          ? "Do I need a separate website for my portfolio?"
          : "Apakah saya perlu website terpisah untuk portfolio saya?",
      answer:
        locale === "en"
          ? "No. showreels.id is designed so creators can start with one clean public profile without building a custom website first."
          : "Tidak perlu. showreels.id dirancang agar creator bisa langsung punya profil publik yang rapi tanpa harus bikin website sendiri dulu.",
    },
    {
      question:
        locale === "en"
          ? "Can clients view my work without logging in?"
          : "Apakah klien bisa melihat karya saya tanpa login?",
      answer:
        locale === "en"
          ? "Yes. Public pages and published videos are built to be easy to open and share through a single link."
          : "Bisa. Halaman publik dan video yang sudah dipublish dibuat agar mudah dibuka dan dibagikan hanya lewat satu link.",
    },
  ];

  const platforms = [
    { name: "YouTube", icon: FaYoutube, tone: "bg-rose-100 text-rose-600" },
    { name: "Google Drive", icon: FaGoogleDrive, tone: "bg-emerald-100 text-emerald-600" },
    { name: "Instagram", icon: FaInstagram, tone: "bg-fuchsia-100 text-fuchsia-600" },
    { name: "Facebook", icon: FaFacebook, tone: "bg-blue-100 text-blue-600" },
    { name: "Vimeo", icon: FaVimeoV, tone: "bg-sky-100 text-sky-600" },
  ];

  const testimonials = useMemo(
    () => [
      {
        quote:
          locale === "en"
            ? "Now I only send one clean portfolio link and clients understand my style much faster."
            : "Sekarang saya cukup kirim satu link portfolio yang rapi dan klien lebih cepat paham gaya editing saya.",
        name: "Nadia Pratiwi",
        role: "Video Editor",
        image: featuredCreators[0]?.image || "",
      },
      {
        quote:
          locale === "en"
            ? "The dashboard makes it easier to keep my best work public without mixing it with drafts."
            : "Dashboard-nya bikin saya lebih mudah menjaga karya terbaik tetap public tanpa bercampur dengan draft.",
        name: "Rangga Saputra",
        role: "Content Creator",
        image: featuredCreators[1]?.image || "",
      },
      {
        quote:
          locale === "en"
            ? "The page feels clean and premium, so I can look more professional even before meeting a client."
            : "Halaman profilnya terasa clean dan premium, jadi saya terlihat lebih profesional bahkan sebelum meeting dengan klien.",
        name: "Mira Anjani",
        role: "Videographer",
        image: featuredCreators[2]?.image || "",
      },
    ],
    [featuredCreators, locale]
  );

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

    return [...shuffledWithBio, ...shuffledWithoutBio].slice(0, 10);
  }, [featuredCreators, creatorDeviceSeed, creatorTimeBucket]);

  const latestVideoRows = useMemo(() => featuredVideos.slice(0, 6), [featuredVideos]);
  const maxVisibleVideos = isDesktop ? 3 : 2;
  const visibleLatestVideos = useMemo(
    () => latestVideoRows.slice(0, maxVisibleVideos),
    [latestVideoRows, maxVisibleVideos]
  );

  useEffect(() => {
    const onScroll = () => {
      setHeaderSolid(window.scrollY > 24);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  return (
    <LazyMotion features={domAnimation} strict>
    <div className="min-h-screen bg-canvas text-slate-950">
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-30 transition-all duration-300",
          headerSolid || mobileMenuOpen
            ? "translate-y-0 border-b border-border bg-white shadow-sm"
            : "-translate-y-full border-b border-transparent bg-transparent pointer-events-none"
        )}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <AppLogo />

          <div className="hidden items-center gap-3 md:flex">
            <SitePreferences compact />

            {currentUser ? (
              <>
                <Link href="/dashboard">
                  <Button variant="secondary">Dashboard</Button>
                </Link>
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                  <AvatarBadge
                    name={currentUser.name || "Creator"}
                    avatarUrl={currentUser.image || ""}
                    size="sm"
                  />
                  <p className="text-xs font-semibold text-slate-700">
                    @{currentUser.username || "creator"}
                  </p>
                </div>
                <Button
                  variant="danger"
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
                <Link href="/auth/login">
                  <Button variant="secondary">{loginLabel}</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="border border-brand-700 bg-brand-600 text-white hover:bg-brand-700">
                    {signupLabel}
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 md:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Open mobile menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/30 md:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu overlay"
          />
          <div className="absolute right-0 top-0 h-full w-[88%] max-w-[340px] border-l border-slate-200 bg-white p-4 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <AppLogo />
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <SitePreferences compact />

              {currentUser ? (
                <>
                  <Link href="/dashboard" className="block" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" className="w-full">
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
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
                  <Link href="/auth/login" className="block" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" className="w-full">
                      {loginLabel}
                    </Button>
                  </Link>
                  <Link href="/auth/signup" className="block" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full border border-brand-700 bg-brand-600 text-white hover:bg-brand-700">
                      {signupLabel}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <main className="pb-16">
        <m.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative mx-[calc(50%-50vw)] min-h-[92vh] w-screen overflow-hidden bg-slate-950"
        >
          <video
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-[0.40]"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
          >
            <source src="/hero-loop.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.44),rgba(15,23,42,0.34)_42%,rgba(248,250,252,0.76)_84%,rgba(248,250,252,0.98)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),rgba(255,255,255,0)_34%)]" />

          <div className="relative mx-auto flex min-h-[92vh] w-full max-w-7xl flex-col justify-end px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32">
            <div className="mx-auto max-w-4xl text-center">
              <div className="flex justify-center">
                <Badge className="inline-flex items-center gap-2 border border-white/60 bg-white/10 px-4 py-2 !text-white shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur-sm">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/60 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">
                    <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                      <span className="absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400/60 animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    Live
                  </span>
                  <span className="text-white">{dictionary.landingBadge}</span>
                </Badge>
              </div>
              <h1 className="mt-6 font-display text-4xl font-semibold leading-tight text-white drop-shadow-[0_12px_28px_rgba(15,23,42,0.32)] sm:text-6xl lg:text-7xl">
                {locale === "en"
                  ? "Showcase your best video portfolio."
                  : "Tampilkan karya video terbaikmu."}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-white/88 drop-shadow-[0_8px_20px_rgba(15,23,42,0.26)] sm:text-lg">
                {locale === "en"
                  ? "A clean and professional public page for content creators, editors, and videographers."
                  : "Halaman publik yang clean dan profesional untuk content creator, editor, dan videographer."}
              </p>

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link href="/auth/signup">
                  <Button size="lg" className="min-w-[210px]">
                    {dictionary.landingCtaPrimary}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="secondary" className="min-w-[200px]">
                    {dictionary.landingCtaSecondary}
                  </Button>
                </Link>
              </div>

              <div
                id="platform-support"
                className="mt-7 flex flex-wrap items-center justify-center gap-2"
              >
                {platforms.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <m.span
                      key={item.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 * index, duration: 0.25 }}
                      whileHover={{ y: -3, scale: 1.03 }}
                      className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/72 px-3 py-1.5 text-xs font-semibold text-slate-800 backdrop-blur-md"
                    >
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${item.tone}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {item.name}
                    </m.span>
                  );
                })}
              </div>
            </div>

          </div>
        </m.section>

        <section id="features" className="content-auto mx-auto mt-10 w-full max-w-7xl px-4 text-center sm:px-6">
          <div className="mx-auto max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
              Features
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950 sm:text-3xl">
              {locale === "en"
                ? "Clean tools for creators who want to look more professional."
                : "Fitur clean untuk creator yang ingin tampil lebih profesional."}
            </h2>
          </div>

          <div className="mt-6 grid gap-4 text-left md:grid-cols-2 xl:grid-cols-4">
            {features.map((item, index) => {
              const Icon = item.icon;
              return (
                <m.div
                  key={item.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ delay: index * 0.06, duration: 0.28 }}
                  whileHover={{ y: -5 }}
                  className="rounded-[1.6rem] border border-white/70 bg-white/68 p-5 shadow-[0_18px_40px_rgba(37,99,235,0.08)] backdrop-blur-xl"
                >
                  <m.div
                    animate={{ y: [0, -5, 0], rotate: [0, 5, 0] }}
                    transition={{
                      duration: 4.8 + index,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100/90 text-brand-700 shadow-inner"
                  >
                    <Icon className="h-5 w-5" />
                  </m.div>
                  <p className="mt-4 text-base font-semibold text-slate-950">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {item.description}
                  </p>
                </m.div>
              );
            })}
          </div>
        </section>

        <div className="relative">
          <AnimatedBackdrop />

          <div className="relative">
            <section
              id="featured-creators"
              className="content-auto mx-auto mt-10 w-full max-w-7xl px-4 text-center sm:px-6"
            >
              <div className="mx-auto max-w-2xl">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
                    Creators
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950 sm:text-3xl">
                    {locale === "en" ? "Featured Creators" : "Creator Pilihan"}
                  </h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {locale === "en"
                    ? "Discover creators with public pages that are ready to be shared with clients."
                    : "Lihat creator dengan halaman publik yang siap dibagikan ke klien."}
                </p>
              </div>

              <div className="mx-auto mt-4 grid max-w-6xl grid-cols-1 gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
                {featuredCreatorCards.length === 0 ? (
                  <p className="text-center text-sm text-slate-600 sm:col-span-2 lg:col-span-3">
                    {locale === "en" ? "No creator yet." : "Belum ada creator."}
                  </p>
                ) : (
                  featuredCreatorCards.map((creator, index) => (
                    <m.div
                      key={creator.id}
                      className="h-full min-w-0"
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ delay: index * 0.06, duration: 0.24 }}
                    >
                      <Link
                        href={creator.username ? `/creator/${creator.username}` : "/auth/signup"}
                        className="flex h-full min-w-0 flex-col rounded-[1.1rem] border border-slate-200 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(239,246,255,0.96))] p-4 shadow-sm transition hover:border-brand-300 hover:shadow-[0_12px_22px_rgba(37,99,235,0.09)]"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <AvatarBadge
                            name={creator.name || "Creator"}
                            avatarUrl={creator.image || ""}
                            size="md"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-950">
                              {creator.name || "Creator"}
                            </p>
                            <p className="truncate text-sm text-slate-500">
                              @{creator.username || "creator"}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
                          {creator.bio?.trim() ||
                            (locale === "en"
                              ? "Bio has not been added yet."
                              : "Bio belum ditambahkan.")}
                        </p>
                      </Link>
                    </m.div>
                  ))
                )}
              </div>
            </section>

            <section id="latest-videos" className="content-auto mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-center gap-3 text-center">
                <h2 className="inline-flex items-center gap-2 font-display text-2xl font-semibold text-slate-950 sm:text-3xl">
                  {locale === "en" ? "Latest videos from creators" : "Video terbaru dari creator"}
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                      <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400/70" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    Live
                  </span>
                </h2>
              </div>

              <div className="mt-3 flex justify-center">
                <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1">
                  <button
                    type="button"
                    onClick={() => setLatestVideosView("grid")}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition",
                      latestVideosView === "grid"
                        ? "bg-brand-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                    aria-label={locale === "en" ? "Grid view" : "Mode grid"}
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
                        ? "bg-brand-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                    aria-label={locale === "en" ? "List view" : "Mode list"}
                  >
                    <List className="h-4 w-4" />
                    List
                  </button>
                </div>
              </div>

              <div
                className={cn(
                  "mx-auto mt-5 max-w-6xl",
                  latestVideosView === "grid"
                    ? "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3"
                    : "space-y-4 sm:space-y-5"
                )}
              >
                {visibleLatestVideos.length === 0 ? (
                  <p className="text-center text-sm text-slate-600">
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
                      <m.div
                        key={video.id}
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.25 }}
                        transition={{ duration: 0.28 }}
                        className={cn(
                          latestVideosView === "grid" ? "h-full" : ""
                        )}
                      >
                        <Link
                          href={`/v/${video.publicSlug}`}
                          aria-label={`${locale === "en" ? "View video" : "Lihat video"} ${video.title}`}
                          className={cn(
                            "group min-w-0 rounded-[1.2rem] border border-slate-200 bg-white/92 shadow-sm transition hover:border-brand-300 hover:shadow-[0_16px_30px_rgba(37,99,235,0.12)]",
                            latestVideosView === "grid"
                              ? "flex h-full min-h-[292px] flex-col gap-2.5 px-4 py-4 sm:min-h-[328px] sm:gap-3 sm:px-5"
                              : "grid grid-cols-[124px_minmax(0,1fr)] items-stretch gap-3 px-4 py-4 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-4 sm:px-5"
                          )}
                        >
                          <div
                            className={cn(
                              "overflow-hidden rounded-xl border border-slate-100 bg-slate-100",
                              latestVideosView === "list"
                                ? "h-full min-h-[96px]"
                                : ""
                            )}
                          >
                            {thumbnail ? (
                              <Image
                                src={thumbnail}
                                alt={`Thumbnail ${video.title}`}
                                width={440}
                                height={248}
                                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                className={cn(
                                  "h-full w-full object-cover",
                                  latestVideosView === "grid"
                                    ? "aspect-video"
                                    : "aspect-video h-full min-h-[96px] sm:min-h-[108px]"
                                )}
                                unoptimized
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div
                                className={cn(
                                  "flex h-full w-full items-center justify-center bg-slate-100 text-sm font-medium text-slate-500",
                                  latestVideosView === "grid"
                                    ? "aspect-video"
                                    : "aspect-video h-full min-h-[96px] sm:min-h-[108px]"
                                )}
                              >
                                <span className="inline-flex items-center gap-1">
                                  <PlayCircle className="h-4 w-4 text-brand-600" />
                                  Video
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex h-full min-w-0 flex-col gap-2.5 sm:gap-3">
                            <div className="flex min-w-0 items-start justify-between gap-3">
                              <p
                                className={cn(
                                  "line-clamp-2 min-w-0 font-semibold text-slate-950",
                                  latestVideosView === "grid"
                                    ? "text-sm sm:text-base"
                                    : "text-sm sm:text-base"
                                )}
                              >
                                {video.title}
                              </p>
                              <span
                                className={cn(
                                  "inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold sm:px-2.5 sm:py-1 sm:text-xs",
                                  sourceMeta.className
                                )}
                              >
                                {sourceMeta.label}
                              </span>
                            </div>

                            <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                              <AvatarBadge
                                name={video.author?.name || "Creator"}
                                avatarUrl={video.author?.image || ""}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-slate-700 sm:text-sm">
                                  {video.author?.name || "Creator"}
                                </p>
                                <p className="truncate text-[11px] text-slate-500 sm:text-xs">
                                  @{video.author?.username || "creator"}
                                </p>
                              </div>
                            </div>

                            <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
                              {video.description}
                            </p>

                            <div className="mt-auto flex min-w-0 items-center justify-between gap-3 border-t border-slate-100 pt-2 text-sm">
                              <div className="flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-600 sm:text-xs">
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 sm:px-2.5 sm:py-1">
                                  {video.durationLabel || "-"}
                                </span>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 sm:px-2.5 sm:py-1">
                                  {postedDateLabel}
                                </span>
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 sm:px-2.5 sm:py-1">
                                  {video.outputType || "-"}
                                </span>
                              </div>
                              <span
                                className={cn(
                                  "inline-flex shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm transition group-hover:bg-brand-700",
                                  "h-9 w-9 sm:h-10 sm:w-10"
                                )}
                                title={locale === "en" ? "View video" : "Lihat video"}
                              >
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                              </span>
                            </div>
                          </div>
                        </Link>
                      </m.div>
                    );
                  })
                )}
              </div>

              <div className="mt-4 flex justify-center">
                <Link href="/videos">
                  <Button className="min-w-[190px] border border-brand-700 bg-brand-600 text-white shadow-soft hover:bg-brand-700">
                    {locale === "en" ? "View all videos" : "Lihat semua"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </section>

            <section id="faq" className="content-auto mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6">
              <div className="rounded-[2rem] border border-border bg-white/84 p-6 shadow-card backdrop-blur-sm sm:p-8">
                <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
                      FAQ
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950 sm:text-3xl">
                      {locale === "en"
                        ? "Frequently asked questions"
                        : "Pertanyaan yang sering ditanyakan"}
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
                      {locale === "en"
                        ? "Quick answers so creators can get started faster."
                        : "Jawaban singkat agar creator bisa mulai lebih cepat."}
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700">
                      <CircleHelp className="h-4 w-4" />
                      {locale === "en" ? "Simple onboarding flow" : "Onboarding yang sederhana"}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {faqItems.map((item, index) => (
                      <FaqItem
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

            <section className="content-auto mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6">
              <div className="rounded-[2rem] border border-border bg-white/88 p-6 shadow-card backdrop-blur-sm sm:p-8">
                <div className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
                    Testimonial
                  </p>
                  <h2 className="mt-2 font-display text-xl font-semibold text-slate-950 sm:text-3xl">
                    {locale === "en" ? "What creators say" : "Kata para creator"}
                  </h2>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {testimonials.map((item, index) => (
                    <m.article
                      key={item.name}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ delay: index * 0.06, duration: 0.24 }}
                      className="rounded-[1.1rem] border border-slate-200 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(239,246,255,0.96))] p-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <AvatarBadge
                          name={item.name}
                          avatarUrl={item.image}
                          size="md"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {item.name}
                          </p>
                          <p className="text-sm text-slate-500">{item.role}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">
                        &ldquo;{item.quote}&rdquo;
                      </p>
                    </m.article>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>

        <section className="content-auto mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6">
          <div className="rounded-[2rem] border border-white/70 bg-white/12 p-6 text-slate-900 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur-md sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Ready
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold text-slate-950 sm:text-4xl">
                  {locale === "en"
                    ? "Publish your portfolio today."
                    : "Publish portofoliomu hari ini."}
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/auth/signup">
                  <Button
                    size="lg"
                    className="min-w-[170px] border border-brand-700 bg-brand-600 text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)] hover:bg-brand-700"
                  >
                    {signupLabel}
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-700">
              <span className="inline-flex items-center gap-1">
                <CircleCheckBig className="h-4 w-4" />
                YouTube and Google Drive
              </span>
              <span className="inline-flex items-center gap-1">
                <CircleCheckBig className="h-4 w-4" />
                Draft / Private / Public
              </span>
              <span className="inline-flex items-center gap-1">
                <CircleCheckBig className="h-4 w-4" />
                Public creator page
              </span>
              <span className="inline-flex items-center gap-1">
                <CircleCheckBig className="h-4 w-4" />
                Framer Motion animation
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-white/92">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <AppLogo />
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
              {locale === "en"
                ? "showreels.id helps content creators present their best work with cleaner, client-ready public pages."
                : "showreels.id membantu content creator menampilkan karya terbaik lewat halaman publik yang rapi dan siap untuk klien."}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Company</p>
            <div className="mt-3 space-y-2 text-sm">
              <Link href="/about" className="block text-slate-600 hover:text-slate-900">
                About
              </Link>
              <Link href="/auth/signup" className="block text-slate-600 hover:text-slate-900">
                Register Creator
              </Link>
              <Link href="/dashboard" className="block text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Support</p>
            <div className="mt-3 space-y-2 text-sm">
              <Link
                href="/customer-service"
                className="block text-slate-600 hover:text-slate-900"
              >
                Customer Service
              </Link>
              <Link href="/auth/login" className="block text-slate-600 hover:text-slate-900">
                Login
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 text-sm text-slate-500 sm:px-6">
            <p>Copyright {year} showreels.id. All rights reserved.</p>
            <p className="inline-flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              Creator-first platform
            </p>
          </div>
        </div>
      </footer>
    </div>
    </LazyMotion>
  );
}





