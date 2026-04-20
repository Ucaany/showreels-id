"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  Camera,
  Circle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  CircleHelp,
  HardDrive,
  LayoutGrid,
  Link2,
  LogOut,
  MapPin,
  Menu,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  UploadCloud,
  Users,
  Video,
  X,
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { AvatarBadge } from "@/components/avatar-badge";
import { SitePreferences } from "@/components/site-preferences";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/hooks/use-preferences";
import { cn } from "@/lib/cn";
import { detectVideoSource, getThumbnailCandidates } from "@/lib/video-utils";

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
      <motion.div
        className="absolute left-[-6%] top-24 h-64 w-64 rounded-full bg-brand-200/45 blur-3xl"
        animate={{ x: [0, 42, 0], y: [0, -24, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-4%] top-[24%] h-72 w-72 rounded-full bg-sky-200/35 blur-3xl"
        animate={{ x: [0, -34, 0], y: [0, 36, 0], scale: [1.04, 0.96, 1.04] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-[28%] top-[58%] h-56 w-56 rounded-full bg-indigo-100/45 blur-3xl"
        animate={{ x: [0, 20, -8, 0], y: [0, -18, 24, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-x-0 top-0 h-full bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(255,255,255,0.86)_24%,rgba(255,255,255,0.97)_100%)]" />
    </div>
  );
}

function LatestVideoThumbButton({
  title,
  sourceUrl,
  thumbnailUrl,
  active,
  onClick,
}: {
  title: string;
  sourceUrl: string;
  thumbnailUrl: string;
  active: boolean;
  onClick: () => void;
}) {
  const candidates = useMemo(
    () => getThumbnailCandidates(sourceUrl, thumbnailUrl),
    [sourceUrl, thumbnailUrl]
  );
  const [candidateIndexRaw, setCandidateIndexRaw] = useState(0);
  const candidateIndex =
    candidates.length === 0 ? 0 : Math.min(candidateIndexRaw, candidates.length);
  const currentThumbnail = candidates[candidateIndex] || "";
  const source = detectVideoSource(sourceUrl);
  const sourceLabel =
    source === "youtube"
      ? "YouTube"
      : source === "gdrive"
        ? "Google Drive"
        : source === "instagram"
          ? "Instagram"
          : source === "vimeo"
            ? "Vimeo"
            : "Video";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full overflow-hidden rounded-2xl border bg-[linear-gradient(180deg,#111827,#0f172a)] text-left shadow-[0_18px_36px_rgba(15,23,42,0.24)] transition",
        active
          ? "border-brand-400 ring-2 ring-brand-200"
          : "border-slate-800 hover:border-brand-400"
      )}
      aria-label={`Pilih video ${title}`}
    >
      {currentThumbnail ? (
        <Image
          src={currentThumbnail}
          alt={`Thumbnail ${title}`}
          width={320}
          height={180}
          sizes="(max-width: 640px) 100vw, 220px"
          unoptimized
          className="aspect-video w-full object-cover opacity-[0.88]"
          loading={active ? "eager" : "lazy"}
          priority={active}
          referrerPolicy="no-referrer"
          onError={() => {
            setCandidateIndexRaw((prev) =>
              prev + 1 < candidates.length ? prev + 1 : candidates.length
            );
          }}
        />
      ) : (
        <div className="flex aspect-video items-center justify-center bg-[linear-gradient(180deg,#111827,#020617)] px-2 text-center text-[11px] font-medium text-slate-400">
          <span className="inline-flex items-center gap-1">
            <PlayCircle className="h-3.5 w-3.5 text-brand-300" />
            {sourceLabel}
          </span>
        </div>
      )}
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-semibold text-white">{title}</p>
      </div>
    </button>
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
    <motion.div
      layout
      className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md"
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-sm font-semibold text-slate-900 sm:text-base">{question}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{answer}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

export function LandingPage({
  creatorCount,
  videoCount,
  featuredCreators,
  featuredVideos,
  currentUser = null,
}: LandingPageProps) {
  const { dictionary, locale } = usePreferences();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [headerSolid, setHeaderSolid] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
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
          ? "No. VideoPort AI Hub is designed so creators can start with one clean public profile without building a custom website first."
          : "Tidak perlu. VideoPort AI Hub dirancang agar creator bisa langsung punya profil publik yang rapi tanpa harus bikin website sendiri dulu.",
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
    { name: "YouTube", icon: PlayCircle, tone: "bg-rose-100 text-rose-700" },
    { name: "Google Drive", icon: HardDrive, tone: "bg-emerald-100 text-emerald-700" },
    { name: "Instagram", icon: Camera, tone: "bg-fuchsia-100 text-fuchsia-700" },
    { name: "Facebook", icon: ThumbsUp, tone: "bg-blue-100 text-blue-700" },
    { name: "Vimeo", icon: Video, tone: "bg-sky-100 text-sky-700" },
  ];

  const stats = useMemo(
    () => [
      {
        id: "featured-creators",
        label: dictionary.statCreators,
        value: creatorCount,
        helper: locale === "en" ? "See creators" : "Lihat creator",
      },
      {
        id: "latest-videos",
        label: dictionary.statVideos,
        value: videoCount,
        helper: locale === "en" ? "See latest videos" : "Lihat video terbaru",
      },
      {
        id: "platform-support",
        label: "Platform",
        value: platforms.length,
        helper: locale === "en" ? "Supported sources" : "Sumber didukung",
      },
    ],
    [creatorCount, dictionary.statCreators, dictionary.statVideos, locale, platforms.length, videoCount]
  );

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

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5200);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  useEffect(() => {
    const onScroll = () => {
      setHeaderSolid(window.scrollY > 24);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const shownCreators = featuredCreators.slice(0, 3);
  const shownVideos = featuredVideos.slice(0, 3);
  const selectedVideoSafeIndex =
    shownVideos.length === 0 ? 0 : Math.min(selectedVideoIndex, shownVideos.length - 1);
  const selectedVideo = shownVideos[selectedVideoSafeIndex] ?? shownVideos[0] ?? null;
  const activeItem = testimonials[activeTestimonial];

  const nextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveTestimonial((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
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
            <Link href="/about" className="text-sm font-medium text-slate-700 hover:text-slate-950">
              About
            </Link>
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
                <Button variant="danger" onClick={() => signOut({ callbackUrl: "/" })}>
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
              <Link href="/about" className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" className="w-full">
                  About
                </Button>
              </Link>

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
                    onClick={() => signOut({ callbackUrl: "/" })}
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
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative mx-[calc(50%-50vw)] min-h-[92vh] w-screen overflow-hidden bg-slate-950"
        >
          <video
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-[0.58]"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
          >
            <source src="/hero-loop.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(248,250,252,0.28),rgba(248,250,252,0.58)_28%,rgba(248,250,252,0.9)_74%,rgba(248,250,252,0.98)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),rgba(255,255,255,0)_36%)]" />

          <div className="relative mx-auto flex min-h-[92vh] w-full max-w-7xl flex-col justify-end px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32">
            <div className="mx-auto max-w-4xl text-center">
              <div className="flex justify-center">
                <Badge className="inline-flex items-center gap-2 bg-white/84 px-4 py-2 text-brand-700 ring-1 ring-white/70 backdrop-blur-sm">
                  <span className="relative flex h-3 w-3 items-center justify-center">
                    <span className="absolute inline-flex h-3 w-3 rounded-full bg-emerald-400/60 animate-ping" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <Circle className="h-3.5 w-3.5 fill-current" />
                  {dictionary.landingBadge}
                </Badge>
              </div>
              <h1 className="mt-6 font-display text-4xl font-semibold leading-tight text-slate-950 sm:text-6xl lg:text-7xl">
                {locale === "en"
                  ? "Showcase your best video portfolio."
                  : "Tampilkan karya video terbaikmu."}
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-base text-slate-700 sm:text-lg">
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

              {!currentUser ? (
                <div className="mt-4 flex justify-center">
                  <Button
                    variant="secondary"
                    className="min-w-[220px] border-white/80 bg-white/82 backdrop-blur-sm"
                    onClick={() =>
                      signIn("google", {
                        callbackUrl: "/dashboard",
                        prompt: "select_account",
                      })
                    }
                  >
                    {locale === "en" ? "Login with Google" : "Login dengan Google"}
                  </Button>
                </div>
              ) : null}

              <div
                id="platform-support"
                className="mt-7 flex flex-wrap items-center justify-center gap-2"
              >
                {platforms.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.span
                      key={item.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08 * index, duration: 0.25 }}
                      whileHover={{ y: -3, scale: 1.03 }}
                      className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/72 px-3 py-1.5 text-xs font-semibold text-slate-800 backdrop-blur-md"
                    >
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${item.tone}`}
                      >
                        <Icon className="h-3 w-3" />
                      </span>
                      {item.name}
                    </motion.span>
                  );
                })}
              </div>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {stats.map((item, index) => (
                <motion.button
                  key={item.id}
                  type="button"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.08, duration: 0.3 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  onClick={() => scrollToSection(item.id)}
                  className="rounded-[1.6rem] border border-white/65 bg-white/74 p-5 text-left shadow-[0_22px_50px_rgba(37,99,235,0.12)] backdrop-blur-md transition hover:border-brand-300"
                >
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-1 font-display text-4xl font-semibold text-slate-950">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm font-medium text-brand-700">{item.helper}</p>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.section>

        <section id="features" className="mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6">
          <div className="rounded-[2rem] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(239,246,255,0.92))] p-6 shadow-[0_24px_60px_rgba(79,158,255,0.12)] sm:p-8">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
                Features
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950 sm:text-3xl">
                {locale === "en"
                  ? "Clean tools for creators who want to look more professional."
                  : "Fitur clean untuk creator yang ingin tampil lebih profesional."}
              </h2>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {features.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.35 }}
                    transition={{ delay: index * 0.06, duration: 0.28 }}
                    whileHover={{ y: -5 }}
                    className="rounded-[1.6rem] border border-white/70 bg-white/68 p-5 shadow-[0_18px_40px_rgba(37,99,235,0.08)] backdrop-blur-xl"
                  >
                    <motion.div
                      animate={{ y: [0, -5, 0], rotate: [0, 5, 0] }}
                      transition={{
                        duration: 4.8 + index,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100/90 text-brand-700 shadow-inner"
                    >
                      <Icon className="h-5 w-5" />
                    </motion.div>
                    <p className="mt-4 text-base font-semibold text-slate-950">{item.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {item.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="relative">
          <AnimatedBackdrop />

          <div className="relative">
            <section
              id="featured-creators"
              className="mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6"
            >
              <div className="rounded-[2rem] border border-border bg-white/86 p-6 shadow-card backdrop-blur-sm sm:p-8">
                <div className="grid gap-3 lg:grid-cols-[auto_1fr] lg:items-end">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
                      Creators
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950 sm:text-3xl">
                      {locale === "en" ? "Featured Creators" : "Creator Pilihan"}
                    </h2>
                  </div>
                  <p className="max-w-xl text-sm text-slate-600 lg:justify-self-end lg:text-right">
                    {locale === "en"
                      ? "Discover creators with public pages that are ready to be shared with clients."
                      : "Lihat creator dengan halaman publik yang siap dibagikan ke klien."}
                  </p>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                  {shownCreators.length === 0 ? (
                    <p className="text-sm text-slate-600">
                      {locale === "en" ? "No creator yet." : "Belum ada creator."}
                    </p>
                  ) : (
                    shownCreators.map((creator, index) => (
                      <motion.div
                        key={creator.id}
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ delay: index * 0.08, duration: 0.28 }}
                      >
                        <Link
                          href={creator.username ? `/creator/${creator.username}` : "/auth/signup"}
                          className="flex h-full flex-col rounded-[1.6rem] border border-slate-200 bg-white/92 p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-[0_18px_36px_rgba(37,99,235,0.1)]"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <AvatarBadge
                                name={creator.name || "Creator"}
                                avatarUrl={creator.image || ""}
                                size="lg"
                              />
                              <div className="min-w-0">
                                <p className="truncate text-lg font-semibold text-slate-950">
                                  {creator.name || "Creator"}
                                </p>
                                <p className="text-sm text-slate-500">
                                  @{creator.username || "creator"}
                                </p>
                              </div>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                              <MapPin className="h-3.5 w-3.5 text-brand-600" />
                              {creator.city || "Lokasi"}
                            </span>
                          </div>

                          <p className="mt-4 min-h-[84px] line-clamp-3 text-sm leading-relaxed text-slate-600">
                            {creator.bio || (locale === "en" ? "No bio yet." : "Bio belum ditambahkan.")}
                          </p>

                          <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                            <span className="text-slate-500">
                              {new Intl.DateTimeFormat(locale === "en" ? "en-US" : "id-ID", {
                                month: "short",
                                year: "numeric",
                              }).format(creator.createdAt)}
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-brand-700">
                              View profile
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section id="latest-videos" className="mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6">
              <div className="rounded-[2rem] border border-slate-800 bg-[linear-gradient(180deg,#0f172a,#020617)] p-6 text-white shadow-[0_24px_60px_rgba(2,6,23,0.32)] sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-300">
                      Latest Videos
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
                      {locale === "en" ? "Fresh work from creators" : "Video terbaru dari creator"}
                    </h2>
                  </div>
                  <p className="max-w-xl text-sm text-slate-300">
                    {locale === "en"
                      ? "Preview the latest published work in a clean, client-facing layout."
                      : "Lihat karya terbaru yang sudah dipublish dalam tampilan yang lebih simple dan fokus."}
                  </p>
                </div>

                <div className="mt-6 space-y-3 lg:hidden">
                  {shownVideos.length === 0 ? (
                    <p className="text-sm text-slate-300">
                      {locale === "en" ? "No video yet." : "Belum ada video."}
                    </p>
                  ) : (
                    shownVideos.map((video) => {
                      const mobileThumbnail =
                        getThumbnailCandidates(video.sourceUrl, video.thumbnailUrl)[0] || "";

                      return (
                        <Link
                          key={`mobile-${video.id}`}
                          href={`/v/${video.publicSlug}`}
                          className="block rounded-[1.4rem] border border-slate-800 bg-slate-950/70 p-3"
                        >
                          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                            {mobileThumbnail ? (
                              <Image
                                src={mobileThumbnail}
                                alt={`Thumbnail ${video.title}`}
                                width={640}
                                height={360}
                                className="aspect-video w-full object-cover opacity-85"
                                unoptimized
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="flex aspect-video items-center justify-center bg-slate-950 text-sm font-medium text-slate-400">
                                <span className="inline-flex items-center gap-1">
                                  <PlayCircle className="h-4 w-4 text-brand-300" />
                                  Video
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="mt-3 line-clamp-2 text-sm font-semibold text-white">
                            {video.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                            {video.description}
                          </p>
                        </Link>
                      );
                    })
                  )}
                </div>

                <div className="mt-6 hidden gap-4 lg:grid lg:grid-cols-[220px_1fr]">
                  {shownVideos.length === 0 ? (
                    <p className="text-sm text-slate-300">
                      {locale === "en" ? "No video yet." : "Belum ada video."}
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {shownVideos.map((video, index) => {
                          const active = index === selectedVideoSafeIndex;

                          return (
                            <LatestVideoThumbButton
                              key={`${video.id}-${video.sourceUrl}-${video.thumbnailUrl}`}
                              title={video.title}
                              sourceUrl={video.sourceUrl}
                              thumbnailUrl={video.thumbnailUrl}
                              active={active}
                              onClick={() => setSelectedVideoIndex(index)}
                            />
                          );
                        })}
                      </div>

                      <div className="rounded-[1.6rem] border border-slate-800 bg-slate-950/72 p-4 shadow-[0_20px_40px_rgba(2,6,23,0.22)]">
                        {selectedVideo ? (
                          <>
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-xl font-semibold text-white">
                                  {selectedVideo.title}
                                </p>
                                <p className="mt-1 text-sm text-slate-400">
                                  {selectedVideo.author?.name || "Creator"}
                                </p>
                              </div>
                              <Badge className="border border-brand-400/30 bg-brand-500/10 text-brand-200 ring-0">
                                {detectVideoSource(selectedVideo.sourceUrl) === "gdrive"
                                  ? "Google Drive"
                                  : detectVideoSource(selectedVideo.sourceUrl) === "youtube"
                                    ? "YouTube"
                                    : detectVideoSource(selectedVideo.sourceUrl) === "instagram"
                                      ? "Instagram"
                                      : detectVideoSource(selectedVideo.sourceUrl) === "vimeo"
                                        ? "Vimeo"
                                        : "Video"}
                              </Badge>
                            </div>

                            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-300">
                                {selectedVideo.description}
                              </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <div className="inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1.5 text-xs text-slate-300">
                                <ShieldCheck className="h-4 w-4 text-brand-300" />
                                {locale === "en" ? "Client-ready preview" : "Preview siap untuk klien"}
                              </div>
                              <div className="inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1.5 text-xs text-slate-300">
                                <Link2 className="h-4 w-4 text-brand-300" />
                                {locale === "en" ? "Public shareable link" : "Link publik siap dibagikan"}
                              </div>
                            </div>

                            <Link
                              href={`/v/${selectedVideo.publicSlug}`}
                              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-300 hover:text-brand-200"
                            >
                              {locale === "en" ? "Open video detail" : "Lihat detail video"}
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            <section id="faq" className="mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6">
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

            <section className="mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6">
              <div className="rounded-[2rem] border border-border bg-white/88 p-6 shadow-card backdrop-blur-sm sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
                      Testimonial
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-semibold text-slate-950 sm:text-3xl">
                      {locale === "en" ? "What creators say" : "Kata para creator"}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={prevTestimonial}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
                      aria-label="Previous testimonial"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextTestimonial}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
                      aria-label="Next testimonial"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${activeItem.name}-${activeTestimonial}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.24 }}
                      className="rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(239,246,255,0.98))] p-6"
                    >
                      <div className="flex items-center gap-4">
                        <AvatarBadge
                          name={activeItem.name}
                          avatarUrl={activeItem.image}
                          size="lg"
                        />
                        <div>
                          <p className="text-lg font-semibold text-slate-950">{activeItem.name}</p>
                          <p className="text-sm text-slate-500">{activeItem.role}</p>
                        </div>
                      </div>
                      <p className="mt-6 text-xl font-medium leading-relaxed text-slate-900 sm:text-2xl">
                        &ldquo;{activeItem.quote}&rdquo;
                      </p>
                    </motion.div>
                  </AnimatePresence>

                  <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    {testimonials.map((item, index) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setActiveTestimonial(index)}
                        className={cn(
                          "rounded-[1.4rem] border p-4 text-left transition",
                          activeTestimonial === index
                            ? "border-brand-300 bg-brand-50/80"
                            : "border-slate-200 bg-white hover:border-brand-200"
                        )}
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
                            <p className="text-xs text-slate-500">{item.role}</p>
                          </div>
                        </div>
                        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600">
                          {item.quote}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <section className="mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6">
          <div className="rounded-[2rem] border border-brand-200 bg-[linear-gradient(135deg,rgba(37,99,235,0.97),rgba(29,78,216,0.92))] p-6 text-white shadow-[0_28px_80px_rgba(37,99,235,0.25)] sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                  Ready
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
                  {locale === "en"
                    ? "Publish your portfolio today."
                    : "Publish portofoliomu hari ini."}
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/auth/signup">
                  <Button
                    size="lg"
                    className="min-w-[170px] border border-white bg-white font-semibold text-slate-900 shadow-[0_14px_28px_rgba(15,23,42,0.18)] hover:bg-slate-100"
                  >
                    {signupLabel}
                  </Button>
                </Link>
                <Link href="/customer-service">
                  <Button size="lg" variant="secondary">
                    Customer Service
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-4 text-sm text-white/92">
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
                ? "VideoPort AI Hub helps content creators present their best work with cleaner, client-ready public pages."
                : "VideoPort AI Hub membantu content creator menampilkan karya terbaik lewat halaman publik yang rapi dan siap untuk klien."}
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
            <p>Copyright {year} VideoPort AI Hub. All rights reserved.</p>
            <p className="inline-flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              Creator-first platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
