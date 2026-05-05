import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Sparkles } from "lucide-react";
import { AvatarBadge } from "@/components/avatar-badge";
import { CreatorBackButton } from "@/components/creator-back-button";
import { CustomLinksList } from "@/components/custom-links-list";
import { ProfileRichText } from "@/components/profile-rich-text";
import { SocialLinks } from "@/components/social-links";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getBackgroundImageCropStyle } from "@/lib/image-crop";
import { formatJoinedMonthYear } from "@/lib/profile-utils";
import { getAutoThumbnailFromVideoUrl } from "@/lib/video-utils";
import { getCurrentUser } from "@/server/current-user";
import { getRequestLocale } from "@/server/request-locale";
import { getPublicProfile } from "@/server/public-data";

const actionCardClass =
  "inline-flex h-12 w-full items-center justify-center rounded-[1.05rem] border px-4 text-sm font-semibold transition";

export default async function CreatorAboutPage({
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
  const hireMeLink = profile.user.contactEmail
    ? `mailto:${profile.user.contactEmail}`
    : cleanedPhone
      ? `https://wa.me/${cleanedPhone.replace(/^\+/, "")}`
      : profile.user.websiteUrl || "/auth/signup";
  const hireMeExternal = !hireMeLink.startsWith("/");
  const autoCoverImage =
    profile.videos[0]?.thumbnailUrl ||
    (profile.videos[0]?.sourceUrl
      ? getAutoThumbnailFromVideoUrl(profile.videos[0].sourceUrl)
      : "");
  const coverImage = profile.user.coverImageUrl || autoCoverImage;
  const aboutHref = `/creator/${username}/about`;
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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_340px]">
          <Card className="space-y-6 rounded-[1.7rem] border-[#d4e2f8] bg-white/95 shadow-[0_12px_30px_rgba(36,74,145,0.08)]">
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold text-[#1b2e4f]">
                  Bio Lengkap
                </h2>
                <Badge>Bio</Badge>
              </div>
              <ProfileRichText
                content={profile.user.bio}
                emptyLabel="Bio belum ditambahkan."
              />
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold text-[#1b2e4f]">
                  Experience
                </h2>
                <Badge>Pengalaman</Badge>
              </div>
              <ProfileRichText
                content={profile.user.experience}
                emptyLabel="Belum ada pengalaman yang ditambahkan."
              />
            </section>
          </Card>

          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <Card className="space-y-4 rounded-[1.7rem] border-[#d4e2f8] bg-white/95 shadow-[0_12px_30px_rgba(36,74,145,0.08)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5873a0]">
                  Detail Creator
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-[#1b2e4f]">
                  Informasi Lengkap
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-[#d4e2f8] bg-[#f9fbff] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5a6f96]">
                    Role
                  </p>
                  <p className="mt-2 text-sm text-[#214273]">
                    {profile.user.role || "Belum diisi"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#d4e2f8] bg-[#f9fbff] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5a6f96]">
                    Kota
                  </p>
                  <p className="mt-2 text-sm text-[#214273]">
                    {profile.user.city || "Belum diisi"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#d4e2f8] bg-[#f9fbff] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5a6f96]">
                    Tanggal Bergabung
                  </p>
                  <p className="mt-2 text-sm text-[#214273]">{joinedMonthYear}</p>
                </div>
                <div className="rounded-2xl border border-[#d4e2f8] bg-[#f9fbff] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5a6f96]">
                    Total Video Publik
                  </p>
                  <p className="mt-2 text-sm text-[#214273]">{profile.videos.length} video</p>
                </div>
              </div>
            </Card>

            <Card className="space-y-4 rounded-[1.7rem] border-[#d4e2f8] bg-white/95 shadow-[0_12px_30px_rgba(36,74,145,0.08)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5873a0]">
                  Social Media
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-[#1b2e4f]">
                  Hubungi Creator
                </h2>
              </div>
              <CustomLinksList links={profile.user.customLinks} />
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
        </div>
      </main>
    </div>
  );
}
