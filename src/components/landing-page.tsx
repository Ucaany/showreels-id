"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  FolderOpen,
  Globe2,
  PlayCircle,
  Share2,
  Sparkles,
  UserRound,
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { AvatarBadge } from "@/components/avatar-badge";
import { SitePreferences } from "@/components/site-preferences";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePreferences } from "@/hooks/use-preferences";

interface LandingPageProps {
  creatorCount: number;
  videoCount: number;
  featuredCreators: Array<{
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    bio: string;
  }>;
  featuredVideos: Array<{
    id: string;
    title: string;
    publicSlug: string;
    description: string;
    author: {
      username: string | null;
      name: string | null;
      image: string | null;
    };
  }>;
}

export function LandingPage({
  creatorCount,
  videoCount,
  featuredCreators,
  featuredVideos,
}: LandingPageProps) {
  const { dictionary, locale } = usePreferences();

  const features = [
    {
      icon: UserRound,
      title:
        locale === "en"
          ? "Professional creator profiles"
          : "Profil kreator yang terasa profesional",
      desc:
        locale === "en"
          ? "Add your bio, experience, skills, and public profile link in one place."
          : "Tampilkan bio, pengalaman, skill, dan profil publik dalam satu tempat.",
    },
    {
      icon: PlayCircle,
      title:
        locale === "en"
          ? "Video pages built for sharing"
          : "Halaman video yang siap dibagikan",
      desc:
        locale === "en"
          ? "Each submission gets a clean public page for clients and collaborators."
          : "Setiap video punya halaman publik rapi untuk klien dan kolaborator.",
    },
    {
      icon: Globe2,
      title:
        locale === "en"
          ? "Deployed for real production use"
          : "Siap dipakai sungguhan di production",
      desc:
        locale === "en"
          ? "Database-backed auth, Google login, and Vercel-ready deployment flow."
          : "Autentikasi berbasis database, login Google, dan siap deploy ke Vercel.",
    },
  ];

  const platformBadges = [
    "YouTube",
    "Google Drive",
    "Instagram Reels",
    "Vimeo",
    "AI Description",
    "Public Creator Profile",
  ];

  const workflowCards = [
    {
      icon: FolderOpen,
      title:
        locale === "en"
          ? "Submit from your favorite platform"
          : "Submit dari platform favoritmu",
      description:
        locale === "en"
          ? "Paste links from YouTube, Google Drive, Instagram, or Vimeo and turn them into portfolio entries."
          : "Tempel link dari YouTube, Google Drive, Instagram, atau Vimeo lalu ubah jadi portofolio siap tampil.",
    },
    {
      icon: Sparkles,
      title:
        locale === "en"
          ? "Generate a cleaner AI-ready description"
          : "Generate deskripsi yang lebih siap tampil",
      description:
        locale === "en"
          ? "Speed up publishing with auto-generated descriptions, slug preview, and public-share links."
          : "Percepat publish dengan deskripsi otomatis, preview slug, dan link public-share yang langsung siap.",
    },
    {
      icon: Share2,
      title:
        locale === "en"
          ? "Share creator profile and video pages"
          : "Bagikan profil kreator dan halaman video",
      description:
        locale === "en"
          ? "Clients can open a creator profile, review published videos, and jump into each public page."
          : "Klien bisa buka profil kreator, melihat semua video yang dipublikasikan, lalu masuk ke tiap public page.",
    },
  ];

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-border bg-white/92 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <AppLogo />
          <div className="flex flex-wrap items-center gap-3">
            <SitePreferences />
            <Link href="/auth/login">
              <Button variant="secondary">{dictionary.login}</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>{dictionary.signup}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]"
        >
          <div className="rounded-[2rem] border border-white/90 bg-white/92 p-8 shadow-[0_35px_90px_rgba(31,88,227,0.14)] backdrop-blur-xl">
            <div className="space-y-6">
              <Badge className="bg-brand-600 text-white">
                {dictionary.landingBadge}
              </Badge>
              <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight text-slate-950 sm:text-6xl">
                {dictionary.landingTitle}
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-slate-700 sm:text-lg">
                {dictionary.landingDescription}
              </p>
              <div className="flex flex-wrap gap-3">
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
              <div className="flex flex-wrap gap-2">
                {platformBadges.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <Card className="border-border bg-surface">
                <p className="text-3xl font-semibold text-slate-900">
                  {creatorCount}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {dictionary.statCreators}
                </p>
              </Card>
              <Card className="border-border bg-surface">
                <p className="text-3xl font-semibold text-slate-900">
                  {videoCount}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {dictionary.statVideos}
                </p>
              </Card>
              <Card className="border-border bg-surface">
                <p className="text-3xl font-semibold text-slate-900">
                  {featuredCreators.length}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {dictionary.statProfiles}
                </p>
              </Card>
            </div>
          </div>

          <Card className="relative overflow-hidden border-border bg-white/92 p-6 shadow-[0_35px_90px_rgba(79,158,255,0.14)]">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-200/70 blur-2xl" />
            <p className="text-sm font-semibold text-brand-800">
              {dictionary.featuredCreators}
            </p>
            <div className="mt-5 space-y-4">
              {featuredCreators.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface-muted p-5 text-sm text-slate-600">
                  Creator pertama yang mendaftar akan muncul di sini.
                </div>
              ) : (
                featuredCreators.map((creator) => (
                  <Link
                    key={creator.id}
                    href={creator.username ? `/creator/${creator.username}` : "/auth/signup"}
                    className="block rounded-2xl border border-sky-100 bg-gradient-to-br from-white via-slate-50 to-sky-100/70 p-4 transition hover:-translate-y-0.5 hover:shadow-soft"
                  >
                    <div className="flex items-center gap-3">
                      <AvatarBadge
                        name={creator.name || "Creator"}
                        avatarUrl={creator.image || ""}
                        size="md"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">
                          {creator.name || "Creator"}
                        </p>
                        <p className="text-sm text-slate-600">
                          @{creator.username || "set-username"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                      {creator.bio || "Profil publik siap dibentuk dari dashboard."}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </motion.section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border-border bg-surface">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-display text-xl font-semibold text-slate-900">
                  {feature.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {feature.desc}
                </p>
              </Card>
            );
          })}
        </section>

        <section className="mt-12 rounded-[2rem] border border-border bg-white/90 p-6 shadow-card">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-4">
              <Badge className="bg-slate-900 text-white">Supported workflow</Badge>
              <h2 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
                {locale === "en"
                  ? "Everything needed to collect, polish, and share video work."
                  : "Semua kebutuhan untuk mengumpulkan, merapikan, dan membagikan karya video."}
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                {locale === "en"
                  ? "Use one dashboard to manage creator identity, support links from major video platforms, generate cleaner descriptions, and publish client-ready pages."
                  : "Gunakan satu dashboard untuk mengelola identitas kreator, menerima link dari platform video populer, membuat deskripsi yang lebih rapi, dan menerbitkan halaman yang siap dilihat klien."}
              </p>
              <div className="flex flex-wrap gap-2">
                {platformBadges.map((item) => (
                  <span
                    key={`workflow-${item}`}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              {workflowCards.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-sky-50/70 p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-semibold text-slate-900">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold text-slate-900">
                {dictionary.featuredVideos}
              </h2>
              <p className="text-sm text-slate-600">
                Video yang sudah dipublikasikan kreator dan bisa langsung dijelajahi.
              </p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {featuredVideos.length === 0 ? (
              <Card className="border-border bg-surface lg:col-span-3">
                <p className="text-sm text-slate-600">
                  Belum ada video publik. Setelah user pertama submit video, showcase
                  akan tampil di sini.
                </p>
              </Card>
            ) : (
              featuredVideos.map((video) => (
                <Link key={video.id} href={`/v/${video.publicSlug}`}>
                  <Card className="h-full border-border bg-surface transition hover:-translate-y-0.5 hover:shadow-soft">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
                      Public video
                    </p>
                    <h3 className="mt-3 font-display text-xl font-semibold text-slate-900">
                      {video.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm text-slate-600">
                      {video.description}
                    </p>
                    <p className="mt-4 text-sm font-medium text-slate-600">
                      {video.author?.name || "Creator"}{" "}
                      {video.author?.username ? `@${video.author.username}` : ""}
                    </p>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
