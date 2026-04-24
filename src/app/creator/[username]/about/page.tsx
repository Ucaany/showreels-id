import Link from "next/link";
import { notFound } from "next/navigation";
import { AvatarBadge } from "@/components/avatar-badge";
import { ProfileRichText } from "@/components/profile-rich-text";
import { PublicMobileHeader } from "@/components/public-mobile-header";
import { SocialLinks } from "@/components/social-links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getBackgroundImageCropStyle } from "@/lib/image-crop";
import { formatJoinedMonthYear } from "@/lib/profile-utils";
import { getAutoThumbnailFromVideoUrl } from "@/lib/video-utils";
import { getCurrentUser } from "@/server/current-user";
import { getRequestLocale } from "@/server/request-locale";
import { getPublicProfile } from "@/server/public-data";

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
  const autoCoverImage =
    profile.videos[0]?.thumbnailUrl ||
    (profile.videos[0]?.sourceUrl
      ? getAutoThumbnailFromVideoUrl(profile.videos[0].sourceUrl)
      : "");
  const coverImage = profile.user.coverImageUrl || autoCoverImage;

  return (
    <div className="min-h-screen bg-canvas">
      <PublicMobileHeader ctaHref="/auth/signup" ctaLabel="Buat Profilmu" />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <Card className="overflow-hidden border-[#ddd3cd] bg-white/92 p-0">
          <div className="relative min-h-[260px] border-b border-border sm:min-h-[320px]">
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
                    "linear-gradient(145deg, rgba(15,23,42,0.20), rgba(15,23,42,0.34))"
                  )}
                />
            ) : null}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.44),_transparent_34%),linear-gradient(180deg,_rgba(255,250,247,0.78),_rgba(255,255,255,0.94))]" />
            <div className="relative flex h-full flex-col justify-between gap-8 p-5 sm:p-8">
              <div className="flex justify-between gap-3">
                <Badge className="w-fit">Profil Lengkap Creator</Badge>
                <Link href={`/creator/${username}`}>
                  <Button variant="secondary" size="sm">
                    Kembali
                  </Button>
                </Link>
              </div>

              <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="inline-flex shrink-0 self-start rounded-full border-4 border-white/90 bg-white shadow-[0_18px_40px_rgba(29,23,20,0.14)]">
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
                  <div>
                    <h1 className="font-display text-3xl font-semibold text-[#201b18] sm:text-4xl">
                      {profile.user.name}
                    </h1>
                    {profile.user.role ? (
                      <p className="text-base font-medium text-[#e24f3b]">
                        {profile.user.role}
                      </p>
                    ) : null}
                    <p className="text-base text-[#635750]">@{profile.user.username}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge>{profile.user.city || "Kota belum diisi"}</Badge>
                      <Badge>Bergabung {joinedMonthYear}</Badge>
                      <Badge>{profile.videos.length} video publik</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[280px]">
                  <Link href={hireMeLink} target="_blank">
                    <Button className="w-full">Hire Me</Button>
                  </Link>
                  <Link href={`/creator/${username}`}>
                    <Button variant="secondary" className="w-full">
                      Lihat Creator
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_340px]">
          <Card className="space-y-6 border-[#ddd3cd] bg-white/92">
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold text-[#201b18]">
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
                <h2 className="font-display text-2xl font-semibold text-[#201b18]">
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
            <Card className="space-y-4 border-[#ddd3cd] bg-white/92">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7d6f67]">
                  Detail Creator
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-[#201b18]">
                  Informasi Lengkap
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Role
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    {profile.user.role || "Belum diisi"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Kota
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    {profile.user.city || "Belum diisi"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Tanggal Bergabung
                  </p>
                  <p className="mt-2 text-sm text-slate-700">{joinedMonthYear}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Total Video Publik
                  </p>
                  <p className="mt-2 text-sm text-slate-700">{profile.videos.length} video</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Website
                  </p>
                  {profile.user.websiteUrl ? (
                    <Link
                      href={profile.user.websiteUrl}
                      target="_blank"
                      className="mt-2 block break-all text-sm font-medium text-brand-700 hover:text-brand-800"
                    >
                      {profile.user.websiteUrl}
                    </Link>
                  ) : (
                    <p className="mt-2 break-all text-sm text-slate-700">Belum diisi</p>
                  )}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Email
                  </p>
                  {profile.user.contactEmail ? (
                    <Link
                      href={`mailto:${profile.user.contactEmail}`}
                      className="mt-2 block break-all text-sm font-medium text-brand-700 hover:text-brand-800"
                    >
                      {profile.user.contactEmail}
                    </Link>
                  ) : (
                    <p className="mt-2 break-all text-sm text-slate-700">Belum diisi</p>
                  )}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Telepon
                  </p>
                  {cleanedPhone ? (
                    <Link
                      href={`https://wa.me/${cleanedPhone.replace(/^\+/, "")}`}
                      target="_blank"
                      className="mt-2 block text-sm font-medium text-brand-700 hover:text-brand-800"
                    >
                      {profile.user.phoneNumber}
                    </Link>
                  ) : (
                    <p className="mt-2 text-sm text-slate-700">Belum diisi</p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="space-y-4 border-border bg-surface">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Social Media
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">
                  Hubungi Creator
                </h2>
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
        </div>
      </main>
    </div>
  );
}
