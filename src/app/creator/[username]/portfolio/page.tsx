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
import { CustomLinksList } from "@/components/custom-links-list";
import { CreatorBackButton } from "@/components/creator-back-button";
import { SocialLinks } from "@/components/social-links";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDateLabel } from "@/lib/helpers";
import { getBackgroundImageCropStyle } from "@/lib/image-crop";
import { formatJoinedMonthYear } from "@/lib/profile-utils";
import { getPublicProfile } from "@/server/public-data";
import { getCurrentUser } from "@/server/current-user";
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

const actionCardClass =
  "inline-flex h-12 w-full items-center justify-center rounded-[1.05rem] border px-4 text-sm font-semibold transition";

export default async function CreatorPortfolioPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ page?: string; view?: string }>;
}) {
  const locale = await getRequestLocale();
  const { username } = await params;
  const resolvedSearchParams = await searchParams;
  const currentUser = await getCurrentUser();
  const profile = await getPublicProfile(username, currentUser?.id);

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
  const autoCoverImage =
    profile.videos[0]?.thumbnailUrl ||
    (profile.videos[0]?.sourceUrl
      ? getAutoThumbnailFromVideoUrl(profile.videos[0].sourceUrl)
      : "");
  const coverImage = profile.user.coverImageUrl || autoCoverImage;
  const hireMeLink = profile.user.contactEmail
    ? `mailto:${profile.user.contactEmail}`
    : cleanedPhone
      ? `https://wa.me/${cleanedPhone.replace(/^\+/, "")}`
      : profile.user.websiteUrl || "/auth/signup";
  const hireMeExternal = !hireMeLink.startsWith("/");
  const aboutHref = `/creator/${username}/about`;
  const profileHref = `/creator/${username}/about`;
  const isProfileOwner = Boolean(currentUser && currentUser.id === profile.user.id);

  const buildPageHref = (page: number) =>
    `/creator/${username}/portfolio?page=${page}&view=${currentView}`;
  const buildViewHref = (view: "grid" | "list") =>
    `/creator/${username}/portfolio?page=1&view=${view}`;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#edf3ff_0%,#f8fbff_48%,#f2f7ff_100%)]">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        <Card className="overflow-hidden rounded-[2rem] border-[#cbddfd] bg-white/95 p-0 shadow-[0_24px_60px_rgba(29,72,148,0.14)]">
          <div className="relative h-[170px] overflow-hidden border-b border-[#d9e6fb] sm:h-[210px]">
            {coverImage ? (
              <div
                className="absolute inset-0"
                style={getBackgroundImageCropStyle(
                  coverImage,
                  {
                    x: profile.user.coverCropX,
                    y: profile.user.coverCropY,
                    zoom: profile.user.coverCropZoom,
                  },
                  "linear-gradient(160deg, rgba(16,54,116,0.18), rgba(16,54,116,0.28))"
                )}
              />
            ) : null}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.64),_transparent_40%),linear-gradient(180deg,_rgba(243,249,255,0.68),_rgba(255,255,255,0.95))]" />
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#2f73ff]/16 blur-3xl" />
            <div className="relative flex h-full items-start justify-between p-4 sm:p-5">
              <Badge className="w-fit border-[#2f73ff]/30 bg-[#2f73ff] text-white shadow-sm">
                <Sparkles className="mr-1 h-3.5 w-3.5" />
                Creator Profile
              </Badge>
              <CreatorBackButton />
            </div>
          </div>
          <div className="relative px-4 pb-5 pt-0 sm:px-5 sm:pb-6">
            <div className="absolute -top-11 left-4 sm:left-5">
              <div className="inline-flex shrink-0 self-start rounded-full border-4 border-white bg-white shadow-[0_16px_34px_rgba(20,46,86,0.2)]">
                <AvatarBadge
                  name={profile.user.name || "Creator"}
                  avatarUrl={profile.user.image || ""}
                  crop={{
                    x: profile.user.avatarCropX,
                    y: profile.user.avatarCropY,
                    zoom: profile.user.avatarCropZoom,
                  }}
                  size="lg"
                />
              </div>
            </div>
            <div className="grid gap-4 pt-14 sm:gap-5 sm:pt-16 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="space-y-2.5">
                <div>
                  <h1 className="font-display text-[1.75rem] font-semibold leading-tight text-[#17305b] sm:text-[2rem]">
                    {profile.user.name}
                  </h1>
                  {profile.user.role ? (
                    <p className="mt-0.5 text-sm font-medium text-[#2f73ff]">
                      {profile.user.role}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center rounded-full border border-[#d4e3fb] bg-[#f6faff] px-2.5 py-1 text-xs font-semibold text-[#4a6592]">
                    @{profile.user.username}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-[#d4e3fb] bg-[#f6faff] px-2.5 py-1 text-xs font-semibold text-[#4a6592]">
                    <MapPin className="mr-1 h-3.5 w-3.5" />
                    {profile.user.city || "Kota belum diisi"}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-[#d4e3fb] bg-[#f6faff] px-2.5 py-1 text-xs font-semibold text-[#4a6592]">
                    Bergabung {joinedMonthYear}
                  </span>
                </div>
              </div>

              <div
                className={`grid gap-2 ${
                  isProfileOwner
                    ? "sm:grid-cols-3 lg:min-w-[370px]"
                    : "sm:grid-cols-2 lg:min-w-[320px]"
                }`}
              >
                <Link
                  href={hireMeLink}
                  target={hireMeExternal ? "_blank" : undefined}
                  rel={hireMeExternal ? "noopener noreferrer" : undefined}
                  className={`${actionCardClass} border-transparent bg-[#2f73ff] text-white shadow-[0_10px_24px_rgba(47,115,255,0.3)] hover:bg-[#255fe0]`}
                >
                  Hire Me
                </Link>
                <Link
                  href={profileHref}
                  className={`${actionCardClass} border-[#ccddfc] bg-white text-[#214273] hover:border-[#2f73ff] hover:bg-[#eef5ff]`}
                >
                  Profile
                </Link>
                {isProfileOwner ? (
                  <Link
                    href="/dashboard"
                    className={`${actionCardClass} border-[#ccddfc] bg-[#edf4ff] text-[#214273] hover:border-[#2f73ff] hover:bg-[#e5f0ff]`}
                  >
                    Dashboard
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <Card className="space-y-4 rounded-[1.7rem] border-[#d4e2f8] bg-white/95 shadow-[0_12px_30px_rgba(36,74,145,0.08)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5873a0]">
                  Tentang Creator
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-[#1b2e4f]">
                  Profil Singkat
                </h2>
              </div>
              <p className="text-sm leading-7 text-[#4f658f]">
                {bioExcerpt || "Bio belum ditambahkan."}
              </p>
              <Link
                href={aboutHref}
                className="inline-flex text-sm font-semibold text-[#2f73ff] transition hover:text-[#225fe0]"
              >
                Lihat profil lengkap
              </Link>
            </Card>

            <Card className="space-y-4 rounded-[1.7rem] border-[#d4e2f8] bg-white/95 shadow-[0_12px_30px_rgba(36,74,145,0.08)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5873a0]">
                  Contact
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-[#1b2e4f]">
                  Hubungi Creator
                </h2>
              </div>
              <div className="space-y-3 text-sm text-[#4f658f]">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#2f73ff]" />
                  <span>{profile.user.contactEmail || "Belum diisi"}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#2f73ff]" />
                  <span>{profile.user.phoneNumber || "Belum diisi"}</span>
                </p>
              </div>
              <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5873a0]">
                    Link Utama
                  </p>
                <CustomLinksList links={profile.user.customLinks} />
              </div>
              <SocialLinks
                variant="icon-card"
                websiteUrl={profile.user.websiteUrl}
                instagramUrl={profile.user.instagramUrl}
                youtubeUrl={profile.user.youtubeUrl}
                facebookUrl={profile.user.facebookUrl}
                threadsUrl={profile.user.threadsUrl}
                linkedinUrl={profile.user.linkedinUrl}
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
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5873a0]">
                  Video Portfolio
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-[#1b2e4f] sm:text-3xl">
                  Portfolio video creator
                </h2>
                <p className="mt-2 text-sm text-[#5a6f96]">
                  Daftar karya video publik yang ditampilkan dari fitur Kelola Video.
                </p>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-[#cfddf7] bg-[#f3f8ff] p-1">
                <Link href={buildViewHref("grid")}>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
                      currentView === "grid"
                        ? "bg-white text-[#17315a] shadow-sm"
                        : "text-[#5a6f96]"
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4 text-[#2f73ff]" />
                    Grid
                  </span>
                </Link>
                <Link href={buildViewHref("list")}>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
                      currentView === "list"
                        ? "bg-white text-[#17315a] shadow-sm"
                        : "text-[#5a6f96]"
                    }`}
                  >
                    <List className="h-4 w-4 text-[#2f73ff]" />
                    List
                  </span>
                </Link>
              </div>
            </div>

            {profile.videos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d4e2f8] bg-[#f6faff] p-8 text-center">
                <Video className="mx-auto h-8 w-8 text-[#5a6f96]" />
                <p className="mt-3 text-sm text-[#5a6f96]">
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
                  {visibleVideos.map((video) => {
                    const sourceLabel = getSourceLabel(video.source as never);
                    const aspectLabel =
                      video.aspectRatio === "portrait"
                        ? "Portrait 9:16"
                        : "Landscape 16:9";
                    const outputLabel = video.outputType.trim() || "General";
                    const durationLabel = video.durationLabel.trim() || "-";
                    const postedLabel = formatDateLabel(video.createdAt.toISOString());

                    return (
                      <Link key={video.id} href={`/v/${video.publicSlug}`}>
                        <article
                          className={`group h-full border-b border-[#dde8fa] bg-transparent py-4 transition hover:border-[#9dc0ff] ${
                            currentView === "list" ? "sm:py-5" : ""
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
                              className={`overflow-hidden rounded-2xl bg-[#edf4ff] ${
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
                                <div className="flex aspect-video items-center justify-center text-sm font-medium text-[#5a6f96]">
                                  Thumbnail belum diisi
                                </div>
                              )}
                            </div>
                            <div className="space-y-3">
                              {currentView === "grid" ? (
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <Badge>{sourceLabel}</Badge>
                                  <span className="text-xs text-[#5a6f96]">
                                    {postedLabel}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <Badge>{sourceLabel}</Badge>
                                  <span className="inline-flex items-center rounded-full border border-[#d4e3fb] bg-[#f3f8ff] px-2.5 py-1 text-xs font-medium text-[#4f6791]">
                                    Output: {outputLabel}
                                  </span>
                                  <span className="inline-flex items-center rounded-full border border-[#d4e3fb] bg-white px-2.5 py-1 text-xs font-medium text-[#5a6f96]">
                                    {postedLabel}
                                  </span>
                                </div>
                              )}
                              <h3 className="text-base font-semibold leading-snug text-[#17315a] sm:text-lg">
                                {video.title}
                              </h3>
                              {currentView === "grid" ? (
                                <div className="flex flex-wrap items-center gap-2.5">
                                  <span className="inline-flex items-center rounded-full bg-[#2f73ff] px-2.5 py-1 text-xs font-semibold text-white">
                                    {aspectLabel}
                                  </span>
                                  <span className="inline-flex items-center rounded-full border border-[#d4e3fb] bg-[#f3f8ff] px-2.5 py-1 text-xs font-medium text-[#4f6791]">
                                    Output: {outputLabel}
                                  </span>
                                  <span className="inline-flex items-center rounded-full border border-[#d4e3fb] bg-white px-2.5 py-1 text-xs font-medium text-[#5a6f96]">
                                    Durasi: {durationLabel}
                                  </span>
                                </div>
                              ) : null}
                              <p className="line-clamp-2 text-sm leading-6 text-[#5a6f96]">
                                {video.description}
                              </p>
                            </div>
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>

                {totalPages > 1 ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dde8fa] pt-4">
                    <p className="text-sm text-[#5a6f96]">
                      Halaman {currentPage} dari {totalPages}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={buildPageHref(Math.max(1, currentPage - 1))}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                          currentPage === 1
                            ? "pointer-events-none border-[#dbe6f8] text-[#9cb1d4]"
                            : "border-[#ccdcf8] text-[#4f6791] hover:border-[#8eb3ff] hover:text-[#2f73ff]"
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
                                ? "border-[#2f73ff] bg-[#2f73ff] text-white"
                                : "border-[#ccdcf8] text-[#4f6791] hover:border-[#8eb3ff] hover:text-[#2f73ff]"
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
                            ? "pointer-events-none border-[#dbe6f8] text-[#9cb1d4]"
                            : "border-[#ccdcf8] text-[#4f6791] hover:border-[#8eb3ff] hover:text-[#2f73ff]"
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

      <footer className="border-t border-[#d7e4f8] bg-gradient-to-b from-white/90 to-[#eaf2ff]/55">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-8 text-center sm:px-6">
          {!profile.whitelabelEnabled ? (
            <p className="text-sm text-[#5a6f96]">Portfolio ini dibuat menggunakan showreels.id</p>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
