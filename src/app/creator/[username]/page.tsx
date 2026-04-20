import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AvatarBadge } from "@/components/avatar-badge";
import { PublicMobileHeader } from "@/components/public-mobile-header";
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
  searchParams: Promise<{ page?: string }>;
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
  const currentPage = Number.isNaN(rawPage)
    ? 1
    : Math.min(Math.max(rawPage, 1), totalPages);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleVideos = profile.videos.slice(startIndex, startIndex + itemsPerPage);
  const joinedMonthYear = formatJoinedMonthYear(profile.user.createdAt, locale);
  const cleanedPhone = (profile.user.phoneNumber || "").replace(/[^\d+]/g, "");
  const bioExcerpt = createExcerpt(profile.user.bio || "", 170);
  const experienceExcerpt = createExcerpt(profile.user.experience || "", 170);
  const hireMeLink = profile.user.contactEmail
    ? `mailto:${profile.user.contactEmail}`
    : cleanedPhone
      ? `https://wa.me/${cleanedPhone.replace(/^\+/, "")}`
      : profile.user.websiteUrl || "/auth/signup";
  const aboutHref = `/creator/${username}/about`;

  const buildPageHref = (page: number) => `/creator/${username}?page=${page}`;

  return (
    <div className="min-h-screen bg-canvas">
      <PublicMobileHeader ctaHref="/auth/signup" ctaLabel="Buat Profilmu" />

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit space-y-4 border-border bg-surface">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.20),_transparent_42%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(219,234,254,0.86))]">
            <div
              className="h-28 w-full"
              style={
                profile.user.coverImageUrl
                  ? {
                      backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.06), rgba(15,23,42,0.18)), url(${profile.user.coverImageUrl})`,
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "cover",
                    }
                  : undefined
              }
            />
          </div>
          <div className="flex items-center gap-3">
            <AvatarBadge
              name={profile.user.name || "Creator"}
              avatarUrl={profile.user.image || ""}
              size="lg"
            />
            <div>
              <p className="font-display text-xl font-semibold text-slate-900">
                {profile.user.name}
              </p>
              <p className="text-sm text-slate-600">
                @{profile.user.username}
              </p>
              <p className="text-xs text-slate-600">
                {profile.user.city || "Kota belum diisi"}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm leading-relaxed text-slate-600">
              {bioExcerpt || "Bio belum ditambahkan."}
            </p>
            {profile.user.bio ? (
              <Link
                href={aboutHref}
                className="inline-flex text-sm font-semibold text-brand-700 transition hover:text-brand-800"
              >
                Lihat selengkapnya
              </Link>
            ) : null}
          </div>
          <p className="text-sm text-slate-600">
            Tanggal bergabung: {joinedMonthYear}
          </p>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Experience
            </p>
            <p className="text-sm text-slate-600">
              {experienceExcerpt || "Belum ada pengalaman yang ditambahkan."}
            </p>
            {profile.user.experience ? (
              <Link
                href={aboutHref}
                className="inline-flex text-sm font-semibold text-brand-700 transition hover:text-brand-800"
              >
                Lihat selengkapnya
              </Link>
            ) : null}
          </div>
          <SocialLinks
            instagramUrl={profile.user.instagramUrl}
            youtubeUrl={profile.user.youtubeUrl}
            facebookUrl={profile.user.facebookUrl}
            threadsUrl={profile.user.threadsUrl}
          />
          <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Contact
            </p>
            <p className="text-sm text-slate-700">
              Email: {profile.user.contactEmail || "Belum diisi"}
            </p>
            <p className="text-sm text-slate-700">
              Telpon: {profile.user.phoneNumber || "Belum diisi"}
            </p>
            <p className="text-sm text-slate-700">
              Website: {profile.user.websiteUrl || "Belum diisi"}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
          <div className="flex flex-wrap gap-2">
            {profile.user.skills.map((skill) => (
              <Badge key={skill}>{skill}</Badge>
            ))}
          </div>
        </Card>

        <Card className="border-border bg-surface">
          <div className="mb-4">
            <h1 className="font-display text-2xl font-semibold text-slate-900">
              Video Portfolio
            </h1>
            <p className="text-sm text-slate-600">
              Video yang sudah dipublikasikan oleh creator ini.
            </p>
          </div>

          {profile.videos.length === 0 ? (
            <p className="text-sm text-slate-600">
              Creator ini belum mempublikasikan video.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                {visibleVideos.map((video) => (
                  <Link key={video.id} href={`/v/${video.publicSlug}`}>
                    <div className="h-full rounded-2xl border border-border bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
                      <div className="flex h-full flex-col gap-4">
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                          {video.thumbnailUrl || getAutoThumbnailFromVideoUrl(video.sourceUrl) ? (
                            <Image
                              src={video.thumbnailUrl || getAutoThumbnailFromVideoUrl(video.sourceUrl)}
                              alt={`Thumbnail ${video.title}`}
                              width={640}
                              height={360}
                              sizes="(max-width: 768px) 100vw, 50vw"
                              unoptimized
                              className="aspect-video w-full object-cover"
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
                            <h2 className="font-semibold text-slate-900">
                              {video.title}
                            </h2>
                            <Badge>{getSourceLabel(video.source as never)}</Badge>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            {video.description}
                          </p>
                          <p className="mt-3 text-xs text-slate-600">
                            {formatDateLabel(video.createdAt.toISOString())}
                          </p>
                        </div>
                      </div>
                    </div>
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
        </Card>
      </main>
    </div>
  );
}
