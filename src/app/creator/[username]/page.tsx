import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Video,
} from "lucide-react";
import { AvatarBadge } from "@/components/avatar-badge";
import { CreatorBackButton } from "@/components/creator-back-button";
import { CustomLinksList } from "@/components/custom-links-list";
import { SocialLinks } from "@/components/social-links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getBackgroundImageCropStyle } from "@/lib/image-crop";
import { formatJoinedMonthYear } from "@/lib/profile-utils";
import { getAutoThumbnailFromVideoUrl } from "@/lib/video-utils";
import { getCurrentUser } from "@/server/current-user";
import { getPublicProfile } from "@/server/public-data";
import { getRequestLocale } from "@/server/request-locale";

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

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const locale = await getRequestLocale();
  const { username } = await params;
  const currentUser = await getCurrentUser();
  const profile = await getPublicProfile(username, currentUser?.id);

  if (!profile) {
    notFound();
  }

  const joinedMonthYear = formatJoinedMonthYear(profile.user.createdAt, locale);
  const cleanedPhone = (profile.user.phoneNumber || "").replace(/[^\d+]/g, "");
  const bioExcerpt = createExcerpt(profile.user.bio || "", 220);
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
  const portfolioHref = `/creator/${username}/portfolio`;
  const previewVideos = (profile.pinnedVideos?.length ? profile.pinnedVideos : profile.videos).slice(0, 3);
  const isProfileOwner = Boolean(currentUser && currentUser.id === profile.user.id);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#edf3ff_0%,#f8fbff_48%,#f2f7ff_100%)]">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
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
                  href={aboutHref}
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

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="order-2 space-y-4 lg:order-1">
            <Card className="space-y-4 rounded-[1.7rem] border-[#d4e2f8] bg-white/95 p-4 shadow-[0_12px_30px_rgba(36,74,145,0.08)] sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5873a0]">
                    Link Utama
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-semibold text-[#1b2e4f]">
                    Tautan Creator
                  </h2>
                </div>
                <span className="rounded-full border border-[#cfe0fb] bg-[#edf4ff] px-2.5 py-1 text-xs font-semibold text-[#2f73ff]">
                  showreels.id/{profile.user.username}
                </span>
              </div>

              <Link href={portfolioHref} className="group block">
                <div className="flex items-center justify-between rounded-2xl border border-[#cfe0fb] bg-[#f3f8ff] px-4 py-3.5 text-[#214273] transition hover:border-[#2f73ff] hover:bg-[#ecf4ff]">
                  <span className="text-sm font-semibold">Lihat Portfolio Video</span>
                  <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>

              <CustomLinksList links={profile.user.customLinks} />
            </Card>

            <Card className="space-y-4 rounded-[1.7rem] border-[#d4e2f8] bg-white/95 p-4 shadow-[0_12px_30px_rgba(36,74,145,0.08)] sm:p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5873a0]">
                  Bio Link Portfolio
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-[#1b2e4f]">
                  Video Pilihan Creator
                </h2>
              </div>

              {previewVideos.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#d4e2f8] bg-[#f7fbff] px-4 py-3 text-sm text-[#5f78a3]">
                  Belum ada video public atau semi-private untuk ditampilkan.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  {previewVideos.map((video) => (
                    <Link key={video.id} href={`/v/${video.publicSlug}`} className="group block">
                      <div className="overflow-hidden rounded-2xl border border-[#dce7f8] bg-white">
                        {video.thumbnailUrl || getAutoThumbnailFromVideoUrl(video.sourceUrl) ? (
                          <Image
                            src={video.thumbnailUrl || getAutoThumbnailFromVideoUrl(video.sourceUrl)}
                            alt={`Thumbnail ${video.title}`}
                            width={420}
                            height={236}
                            className="aspect-video w-full object-cover transition group-hover:scale-[1.02]"
                            unoptimized
                          />
                        ) : (
                          <div className="flex aspect-video items-center justify-center bg-[#edf4ff] text-xs text-[#5f78a3]">
                            Thumbnail belum tersedia
                          </div>
                        )}
                        <div className="px-3 py-2">
                          {video.pinnedToProfile ? (
                            <span className="mb-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                              Pinned #{video.pinnedOrder || 1}
                            </span>
                          ) : null}
                          <p className="line-clamp-2 text-sm font-semibold text-[#243a5f]">
                            {video.title}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <Link href={portfolioHref}>
                <Button variant="secondary" className="w-full sm:w-auto">
                  Buka halaman portfolio
                </Button>
              </Link>
            </Card>

            <Card className="space-y-4 rounded-[1.7rem] border-[#d4e2f8] bg-white/95 p-4 shadow-[0_12px_30px_rgba(36,74,145,0.08)] sm:p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5873a0]">
                  Social Media
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold text-[#1b2e4f]">
                  Ikuti Creator
                </h2>
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
            </Card>
          </section>

          <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-6 lg:self-start">
            <Card className="space-y-3 rounded-[1.7rem] border-[#d4e2f8] bg-white/95 p-4 shadow-[0_12px_30px_rgba(36,74,145,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5873a0]">
                Tentang Creator
              </p>
              <h3 className="font-display text-2xl font-semibold text-[#1b2e4f]">Profil Singkat</h3>
              <p className="text-sm leading-7 text-[#4f658f]">
                {bioExcerpt || "Bio belum ditambahkan."}
              </p>
              <Link href={aboutHref} className="inline-flex text-sm font-semibold text-[#2f73ff] hover:text-[#225fe0]">
                Lihat profil lengkap
              </Link>
            </Card>

            <Card className="space-y-3 rounded-[1.7rem] border-[#d4e2f8] bg-white/95 p-4 shadow-[0_12px_30px_rgba(36,74,145,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5873a0]">
                Contact
              </p>
              <h3 className="font-display text-2xl font-semibold text-[#1b2e4f]">Hubungi Creator</h3>
              <div className="space-y-2 text-sm text-[#4f658f]">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#2f73ff]" />
                  <span>{profile.user.contactEmail || "Belum diisi"}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#2f73ff]" />
                  <span>{profile.user.phoneNumber || "Belum diisi"}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-[#2f73ff]" />
                  <span>{profile.videos.length} video publik</span>
                </p>
              </div>
            </Card>
          </aside>
        </div>
      </main>

      <footer className="border-t border-[#d7e4f8] bg-gradient-to-b from-white/90 to-[#eaf2ff]/55">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center sm:px-6">
          {!profile.whitelabelEnabled ? (
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#d4e2f8] bg-white/90 px-4 py-2.5 text-sm text-[#4f658f] shadow-[0_10px_24px_rgba(20,48,91,0.08)]">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#edf4ff] text-[#2f73ff]">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <span>
                Halaman ini dibuat oleh{" "}
                <span className="font-semibold text-[#1f58e3]">showreels.id</span>
              </span>
              <Link href="/auth/signup" className="inline-flex items-center font-semibold text-[#2f73ff] hover:text-[#225fe0]">
                Buat halamanmu
                <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </div>
          ) : null}
        </div>
      </footer>
    </div>
  );
}
