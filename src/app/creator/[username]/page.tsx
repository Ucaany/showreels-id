import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  LayoutGrid,
  List,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Video,
} from "lucide-react";
import { AvatarBadge } from "@/components/avatar-badge";
import { SocialLinks } from "@/components/social-links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateLabel } from "@/lib/helpers";
import { formatJoinedMonthYear } from "@/lib/profile-utils";
import { getPublicProfile } from "@/server/public-data";
import { getRequestLocale } from "@/server/request-locale";
import { getAutoThumbnailFromVideoUrl, getSourceLabel } from "@/lib/video-utils";

function createExcerpt(value: string, limit: number) {
  const plain = value.replace(/\s+/g, " ").trim();
  if (!plain) {
    return "";
  }

  if (plain.length <= limit) {
    return plain;
  }

  return `${plain.slice(0, limit).trim()}...`;
}

export default async function CreatorProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string; view?: string }>;
}) {
  const locale = await getRequestLocale();
  const { username } = await params;
  const resolvedSearchParams = await searchParams;
  const profile = await getPublicProfile(username);

  if (!profile) {
    notFound();
  }

  const itemsPerPage = 4;
  const totalPages = Math.max(1, Math.ceil(profile.videos.length / itemsPerPage));
  const rawPage = Number.parseInt(resolvedSearchParams.page || "1", 10);
  const currentView = resolvedSearchParams.view === "list" ? "list" : "grid";
  const currentPage = Number.isNaN(rawPage)
    ? 1
    : Math.min(Math.max(rawPage, 1), totalPages);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleVideos = profile.videos.slice(startIndex, startIndex + itemsPerPage);
  const joinedMonthYear = formatJoinedMonthYear(profile.user.createdAt, locale);
  const cleanedPhone = (profile.user.phoneNumber || "").replace(/[^\d+]/g, "");
  const bioExcerpt = createExcerpt(profile.user.bio || "", 210);
  const hireMeLink = profile.user.contactEmail
    ? `mailto:${profile.user.contactEmail}`
    : cleanedPhone
      ? `https://wa.me/${cleanedPhone.replace(/^\+/, "")}`
      : profile.user.websiteUrl || "/auth/signup";
  const aboutHref = `/creator/${username}/about`;

  const buildPageHref = (page: number) =>
    `/creator/${username}?page=${page}&view=${currentView}`;
  const buildViewHref = (view: "grid" | "list") =>
    `/creator/${username}?page=1&view=${view}`;

  return (
    <div className="min-h-screen bg-canvas">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        <Card className="overflow-hidden border-border bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))] p-0">
          <div className="relative overflow-hidden border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_42%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(219,234,254,0.9))]">
            {profile.user.coverImageUrl ? (
              <div
                className="absolute inset-x-0 top-0 h-28 opacity-30 sm:h-40"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.06), rgba(15,23,42,0.20)), url(${profile.user.coverImageUrl})`,
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                }}
              />
            ) : null}
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-t from-white via-white/78 to-white/20 sm:h-40" />
            <div className="relative flex flex-col justify-between gap-6 p-5 sm:gap-8 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Badge className="w-fit">
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  Creator Profile
                </Badge>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="rounded-full border-4 border-white/90 bg-white shadow-[0_18px_40px_rgba(37,99,235,0.18)]">
                    <AvatarBadge
                      name={profile.user.name || "Creator"}
                      avatarUrl={profile.user.image || ""}
                      size="lg"
                    />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h1 className="font-display text-3xl font-semibold text-slate-950 sm:text-4xl">
                        {profile.user.name}
                      </h1>
                      {profile.user.role ? (
                        <p className="mt-1 text-base font-medium text-brand-700">
                          {profile.user.role}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-sm font-medium text-slate-600">
                        @{profile.user.username}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-sm font-medium text-slate-600">
                        <MapPin className="mr-1 h-3.5 w-3.5" />
                        {profile.user.city || "Kota belum diisi"}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-sm font-medium text-slate-600">
                        Bergabung {joinedMonthYear}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-sm font-medium text-slate-600">
                        {profile.videos.length} video publik
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px]">
                  <Link href={hireMeLink} target="_blank">
                    <Button className="w-full">Hire Me</Button>
                  </Link>
                  <Link href={aboutHref}>
                    <Button variant="secondary" className="w-full">
                      Profil Lengkap
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <Card className="space-y-4 border-border bg-surface">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Tentang creator
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">
                  Profil Singkat
                </h2>
              </div>
              <p className="text-sm leading-7 text-slate-600">
                {bioExcerpt || "Bio belum ditambahkan."}
              </p>
              <Link
                href={aboutHref}
                className="inline-flex text-sm font-semibold text-brand-700 transition hover:text-brand-800"
              >
                Lihat profil lengkap
              </Link>
            </Card>

            <Card className="space-y-4 border-border bg-surface">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Contact
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">
                  Hubungi Creator
                </h2>
              </div>
              <div className="space-y-3 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-brand-600" />
                  <span>{profile.user.contactEmail || "Belum diisi"}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-brand-600" />
                  <span>{profile.user.phoneNumber || "Belum diisi"}</span>
                </p>
              </div>
              <SocialLinks
                instagramUrl={profile.user.instagramUrl}
                youtubeUrl={profile.user.youtubeUrl}
                facebookUrl={profile.user.facebookUrl}
                threadsUrl={profile.user.threadsUrl}
              />
              <div className="flex flex-wrap gap-2">
                {profile.user.skills.map((skill) => (
                  <Badge key={skill}>{skill}</Badge>
                ))}
              </div>
            </Card>
          </div>

          <section className="px-0 py-1">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Video Portfolio
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
                  Karya terbaru creator
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Pilihan video publik yang siap dibuka client dari halaman ini.
                </p>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
                <Link href={buildViewHref("grid")}>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
                      currentView === "grid"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600"
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4 text-brand-600" />
                    Grid
                  </span>
                </Link>
                <Link href={buildViewHref("list")}>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
                      currentView === "list"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600"
                    }`}
                  >
                    <List className="h-4 w-4 text-brand-600" />
                    List
                  </span>
                </Link>
              </div>
            </div>

            {profile.videos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <Video className="mx-auto h-8 w-8 text-slate-500" />
                <p className="mt-3 text-sm text-slate-600">
                  Creator ini belum mempublikasikan video.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div
                  className={
                    currentView === "grid"
                      ? "grid gap-4 md:grid-cols-2"
                      : "grid gap-3"
                  }
                >
                  {visibleVideos.map((video) => (
                    <Link key={video.id} href={`/v/${video.publicSlug}`}>
                      <article
                        className={`group h-full border-b border-slate-200 bg-transparent py-4 transition hover:border-brand-300 ${
                          currentView === "list"
                            ? "sm:py-5"
                            : ""
                        }`}
                      >
                        <div
                          className={
                            currentView === "list"
                              ? "flex h-full flex-col gap-4 sm:flex-row sm:items-start"
                              : "flex h-full flex-col gap-4"
                          }
                        >
                          <div
                            className={`overflow-hidden rounded-2xl bg-slate-100 ${
                              currentView === "list" ? "sm:w-[180px] sm:flex-none" : ""
                            }`}
                          >
                            {video.thumbnailUrl ||
                            getAutoThumbnailFromVideoUrl(video.sourceUrl) ? (
                              <Image
                                src={
                                  video.thumbnailUrl ||
                                  getAutoThumbnailFromVideoUrl(video.sourceUrl)
                                }
                                alt={`Thumbnail ${video.title}`}
                                width={640}
                                height={360}
                                sizes="(max-width: 768px) 100vw, 38vw"
                                unoptimized
                                className={`aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.02] ${
                                  currentView === "list" ? "sm:h-full sm:min-h-[112px]" : ""
                                }`}
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex aspect-video items-center justify-center text-sm font-medium text-slate-500">
                                Thumbnail belum diisi
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge>{getSourceLabel(video.source as never)}</Badge>
                              <span className="text-xs text-slate-500">
                                {formatDateLabel(video.createdAt.toISOString())}
                              </span>
                            </div>
                            <h3 className="text-base font-semibold leading-snug text-slate-900 sm:text-lg">
                              {video.title}
                            </h3>
                            <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                              {video.description}
                            </p>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>

                {totalPages > 1 ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                    <p className="text-sm text-slate-600">
                      Halaman {currentPage} dari {totalPages}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={buildPageHref(Math.max(1, currentPage - 1))}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                          currentPage === 1
                            ? "pointer-events-none border-slate-200 text-slate-400"
                            : "border-slate-300 text-slate-700 hover:border-brand-300 hover:text-brand-700"
                        }`}
                      >
                        Sebelumnya
                      </Link>
                      {Array.from({ length: totalPages }, (_, index) => {
                        const page = index + 1;
                        const active = page === currentPage;
                        return (
                          <Link
                            key={page}
                            href={buildPageHref(page)}
                            className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition ${
                              active
                                ? "border-brand-500 bg-brand-600 text-white"
                                : "border-slate-300 text-slate-700 hover:border-brand-300 hover:text-brand-700"
                            }`}
                          >
                            {page}
                          </Link>
                        );
                      })}
                      <Link
                        href={buildPageHref(Math.min(totalPages, currentPage + 1))}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                          currentPage === totalPages
                            ? "pointer-events-none border-slate-200 text-slate-400"
                            : "border-slate-300 text-slate-700 hover:border-brand-300 hover:text-brand-700"
                        }`}
                      >
                        Berikutnya
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white/85">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-8 text-center sm:px-6">
          <p className="text-sm text-slate-600">Halaman ini dibuat oleh videoportai</p>
        </div>
      </footer>
    </div>
  );
}
