"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  Camera,
  ChevronLeft,
  ChevronRight,
  CircleCheckBig,
  HardDrive,
  LayoutGrid,
  LogOut,
  MapPin,
  Menu,
  PlayCircle,
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
        "w-full overflow-hidden rounded-lg border bg-white text-left transition",
        active
          ? "border-brand-400 ring-2 ring-brand-200"
          : "border-slate-200 hover:border-brand-300"
      )}
      aria-label={`Pilih video ${title}`}
    >
      {currentThumbnail ? (
        <Image
          src={currentThumbnail}
          alt={`Thumbnail ${title}`}
          width={320}
          height={180}
          sizes="(max-width: 640px) 34vw, 130px"
          unoptimized
          className="aspect-video w-full object-cover"
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
        <div className="flex aspect-video items-center justify-center bg-slate-100 px-2 text-center text-[11px] font-medium text-slate-500">
          <span className="inline-flex items-center gap-1">
            <PlayCircle className="h-3.5 w-3.5 text-brand-600" />
            {sourceLabel}
          </span>
        </div>
      )}
    </button>
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
          ? "Build one clean profile for clients."
          : "Bangun satu profil yang rapi untuk klien.",
    },
    {
      icon: UploadCloud,
      title: locale === "en" ? "Quick Submit" : "Submit Cepat",
      description:
        locale === "en"
          ? "Upload and publish with simple flow."
          : "Upload dan publish lewat alur yang sederhana.",
    },
    {
      icon: LayoutGrid,
      title: locale === "en" ? "Dashboard Control" : "Kontrol Dashboard",
      description:
        locale === "en"
          ? "Manage status, links, and visibility."
          : "Kelola status, link, dan visibilitas video.",
    },
    {
      icon: BriefcaseBusiness,
      title: locale === "en" ? "Client Ready" : "Siap untuk Klien",
      description:
        locale === "en"
          ? "Portfolio that looks professional."
          : "Portfolio yang terlihat profesional.",
    },
  ];

  const testimonials = [
    {
      quote:
        locale === "en"
          ? "Now I send one profile link and clients reply faster."
          : "Sekarang saya cukup kirim satu link profil dan klien respon lebih cepat.",
      name: "Nadia Pratiwi",
      role: "Video Editor",
    },
    {
      quote:
        locale === "en"
          ? "Upload to publish feels much cleaner."
          : "Proses upload sampai publish terasa jauh lebih rapi.",
      name: "Rangga Saputra",
      role: "Content Creator",
    },
    {
      quote:
        locale === "en"
          ? "The page looks premium with less setup."
          : "Halamannya terlihat premium tanpa setup yang rumit.",
      name: "Mira Anjani",
      role: "Videographer",
    },
  ];

  const platforms = [
    { name: "YouTube", icon: PlayCircle, tone: "bg-rose-100 text-rose-700" },
    { name: "Google Drive", icon: HardDrive, tone: "bg-emerald-100 text-emerald-700" },
    { name: "Instagram", icon: Camera, tone: "bg-fuchsia-100 text-fuchsia-700" },
    { name: "Facebook", icon: ThumbsUp, tone: "bg-blue-100 text-blue-700" },
    { name: "Vimeo", icon: Video, tone: "bg-sky-100 text-sky-700" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4800);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  useEffect(() => {
    const onScroll = () => {
      setHeaderSolid(window.scrollY > 20);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nextTestimonial = () => {
    setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveTestimonial((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  const activeItem = testimonials[activeTestimonial];
  const shownCreators = featuredCreators.slice(0, 3);
  const shownVideos = featuredVideos.slice(0, 3);
  const selectedVideoSafeIndex =
    shownVideos.length === 0 ? 0 : Math.min(selectedVideoIndex, shownVideos.length - 1);
  const selectedVideo = shownVideos[selectedVideoSafeIndex] ?? shownVideos[0] ?? null;

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
            <Link
              href="/customer-service"
              className="text-sm font-medium text-slate-700 hover:text-slate-950"
            >
              Customer Service
            </Link>
            <SitePreferences />

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
                  onClick={() => signOut({ callbackUrl: "/" })}
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
              <SitePreferences />
              <Link href="/about" className="block" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" className="w-full">About</Button>
              </Link>
              <Link
                href="/customer-service"
                className="block"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button variant="secondary" className="w-full">Customer Service</Button>
              </Link>

              {currentUser ? (
                <>
                  <Link href="/dashboard" className="block" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" className="w-full">Dashboard</Button>
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
                    <Button variant="secondary" className="w-full">{loginLabel}</Button>
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

      <main className="mx-auto w-full max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_28px_80px_rgba(37,99,235,0.11)] sm:p-10">
            <video
              className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-30"
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              aria-hidden="true"
            >
              <source src="/hero-loop.mp4" type="video/mp4" />
            </video>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),rgba(255,255,255,0.82)_70%)]" />
            <div className="relative z-10 text-center">
              <Badge className="bg-brand-600 text-white">{dictionary.landingBadge}</Badge>
            </div>
            <h1 className="relative z-10 mt-5 text-center font-display text-4xl font-semibold leading-tight text-slate-950 sm:text-6xl">
              {locale === "en"
                ? "Showcase your best video portfolio."
                : "Tampilkan karya video terbaikmu."}
            </h1>
            <p className="relative z-10 mx-auto mt-4 max-w-2xl text-center text-base text-slate-700 sm:text-lg">
              {locale === "en"
                ? "Clean, light, and professional pages for content creators."
                : "Halaman clean, light, dan profesional untuk content creator."}
            </p>
            <div className="relative z-10 mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/auth/signup">
                <Button size="lg">
                  {dictionary.landingCtaPrimary}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="secondary">
                  {dictionary.landingCtaSecondary}
                </Button>
              </Link>
            </div>

            <div
              id="platform-support"
              className="relative z-10 mt-5 flex flex-wrap items-center justify-center gap-2"
            >
              {platforms.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.span
                    key={item.name}
                    whileHover={{ y: -2, scale: 1.03 }}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
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

            <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-3">
              {stats.map((item) => (
                <motion.button
                  key={item.id}
                  type="button"
                  whileHover={{ y: -3, scale: 1.01 }}
                  onClick={() => scrollToSection(item.id)}
                  className="rounded-2xl border border-border bg-surface p-5 text-left shadow-card transition hover:border-brand-300"
                >
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-1 font-display text-3xl font-semibold text-slate-900">
                    {item.value}
                  </p>
                  <p className="mt-2 text-xs font-medium text-brand-700">{item.helper}</p>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-[linear-gradient(160deg,rgba(255,255,255,0.97),rgba(219,234,254,0.9))] p-6 shadow-[0_24px_60px_rgba(79,158,255,0.13)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
              Features
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {features.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    whileHover={{ y: -3 }}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {item.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.section>

        <section className="mt-10 grid gap-4 lg:grid-cols-[1.2fr_0.9fr_0.9fr]">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                  Testimonial
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-slate-900">
                  {locale === "en" ? "What creators say" : "Kata para creator"}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevTestimonial}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={nextTestimonial}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700"
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeItem.name}-${activeTestimonial}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.24 }}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <p className="text-lg font-medium leading-relaxed text-slate-900">
                  &ldquo;{activeItem.quote}&rdquo;
                </p>
                <p className="mt-4 font-semibold text-slate-900">{activeItem.name}</p>
                <p className="text-sm text-slate-500">{activeItem.role}</p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-4 flex items-center gap-2">
              {testimonials.map((item, index) => (
                <button
                  key={item.name}
                  type="button"
                  aria-label={`Go to testimonial ${index + 1}`}
                  onClick={() => setActiveTestimonial(index)}
                  className={`h-2.5 rounded-full transition ${
                    activeTestimonial === index
                      ? "w-8 bg-brand-600"
                      : "w-2.5 bg-slate-300"
                  }`}
                />
              ))}
            </div>
          </div>

          <div id="featured-creators" className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
              Featured Creators
            </p>
            <div className="mt-4 space-y-3">
              {shownCreators.length === 0 ? (
                <p className="text-sm text-slate-600">
                  {locale === "en" ? "No creator yet." : "Belum ada creator."}
                </p>
              ) : (
                shownCreators.map((creator) => (
                  <Link
                    key={creator.id}
                    href={creator.username ? `/creator/${creator.username}` : "/auth/signup"}
                    className="block rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <div className="flex items-center gap-2">
                      <AvatarBadge
                        name={creator.name || "Creator"}
                        avatarUrl={creator.image || ""}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {creator.name || "Creator"}
                          </p>
                          <p className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-slate-500">
                            <MapPin className="h-3.5 w-3.5 text-brand-600" />
                            {creator.city || "Lokasi"}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500">
                          @{creator.username || "creator"} •{" "}
                          {new Intl.DateTimeFormat(locale === "en" ? "en-US" : "id-ID", {
                            month: "short",
                            year: "numeric",
                          }).format(creator.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div id="latest-videos" className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
              Latest Videos
            </p>
            <div className="mt-4 space-y-2 sm:hidden">
              {shownVideos.length === 0 ? (
                <p className="text-sm text-slate-600">
                  {locale === "en" ? "No video yet." : "Belum ada video."}
                </p>
              ) : (
                shownVideos.map((video) => (
                  <Link
                    key={`mobile-${video.id}`}
                    href={`/v/${video.publicSlug}`}
                    className="block rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <p className="line-clamp-1 text-sm font-semibold text-slate-900">
                      {video.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {video.description}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {video.author?.name || "Creator"}
                    </p>
                  </Link>
                ))
              )}
            </div>
            <div className="mt-4 hidden gap-3 sm:grid sm:grid-cols-[130px_1fr]">
              {shownVideos.length === 0 ? (
                <p className="text-sm text-slate-600">
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

                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    {selectedVideo ? (
                      <>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedVideo.title}
                        </p>
                        <p className="mt-1 line-clamp-3 text-xs text-slate-500">
                          {selectedVideo.description}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">
                          {selectedVideo.author?.name || "Creator"}
                        </p>
                        <Link
                          href={`/v/${selectedVideo.publicSlug}`}
                          className="mt-3 inline-flex text-xs font-semibold text-brand-700 hover:text-brand-800"
                        >
                          Lihat detail video
                        </Link>
                      </>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-brand-200 bg-[linear-gradient(135deg,rgba(37,99,235,0.95),rgba(29,78,216,0.9))] p-6 text-white sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                Ready
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold">
                {locale === "en" ? "Publish your portfolio today." : "Publish portofoliomu hari ini."}
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
          <div className="mt-5 flex flex-wrap gap-4 text-sm text-white/90">
            <span className="inline-flex items-center gap-1">
              <CircleCheckBig className="h-4 w-4" />
              YouTube & Google Drive
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
