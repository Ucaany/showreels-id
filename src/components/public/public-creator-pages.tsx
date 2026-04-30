import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarDays, Grid2X2, List, Search, Video } from "lucide-react";
import { AvatarBadge } from "@/components/avatar-badge";
import { MediaPreviewCarousel } from "@/components/media-preview-carousel";
import { PublicShareQrActions } from "@/components/public/public-share-qr-actions";
import { SocialLinks } from "@/components/social-links";
import { Card } from "@/components/ui/card";
import { formatDateLabel } from "@/lib/helpers";
import { getBackgroundImageCropStyle } from "@/lib/image-crop";
import { createTextExcerpt, getCreatorBioHref, getCreatorPortfolioHref, getSafeExternalUrl, getVideoDetailHref } from "@/lib/public-route-utils";
import { getAutoThumbnailFromVideoUrl, getSourceLabel } from "@/lib/video-utils";

type PublicProfile = NonNullable<Awaited<ReturnType<typeof import("@/server/public-data").getPublicProfile>>>;
type PublicVideo = NonNullable<Awaited<ReturnType<typeof import("@/server/public-data").getPublicVideo>>>;
type ProfileVideo = PublicProfile["videos"][number];

const pageShellClass = "min-h-screen bg-[#F5F5F4] text-[#111111]";
const cardClass = "border-[#E1E1DF] bg-white shadow-[0_18px_50px_rgba(17,17,17,0.06)]";
const monoButtonClass = "inline-flex min-h-[52px] w-full items-center justify-between gap-3 rounded-[1.25rem] border border-[#E1E1DF] bg-white px-4 text-left text-sm font-semibold text-[#111111] transition hover:-translate-y-0.5 hover:border-[#111111] hover:shadow-[0_12px_28px_rgba(17,17,17,0.08)] focus:outline-none focus:ring-2 focus:ring-[#111111]/20";

function getVideoThumb(video: Pick<ProfileVideo, "thumbnailUrl" | "sourceUrl">) {
  return video.thumbnailUrl || getAutoThumbnailFromVideoUrl(video.sourceUrl) || "";
}

function PlatformBadge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-[#DADADA] bg-[#F0F0EF] px-2.5 py-1 text-[11px] font-semibold text-[#525252]">{children}</span>;
}

function PublicFooter({ hidden }: { hidden?: boolean }) {
  if (hidden) return null;
  return (
    <footer className="px-4 pb-8 text-center text-xs font-medium text-[#8A8A8A]">
      Made with <span className="font-semibold text-[#111111]">Showreels.id</span>
    </footer>
  );
}

function CreatorCover({ profile, className = "h-36" }: { profile: PublicProfile; className?: string }) {
  const autoCoverImage = getVideoThumb(profile.videos[0] || { thumbnailUrl: "", sourceUrl: "" });
  const coverImage = profile.user.coverImageUrl || autoCoverImage;

  return (
    <div className={`relative overflow-hidden rounded-[1.75rem] border border-[#E1E1DF] bg-[radial-gradient(circle_at_20%_20%,#ffffff_0%,#EFEDEA_35%,#d8d6d1_100%)] ${className}`}>
      {coverImage ? (
        <div
          className="absolute inset-0"
          style={getBackgroundImageCropStyle(
            coverImage,
            { x: profile.user.coverCropX, y: profile.user.coverCropY, zoom: profile.user.coverCropZoom },
            "linear-gradient(135deg,#F5F5F4,#E7E5E0)"
          )}
        />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(245,245,244,0.08),rgba(17,17,17,0.18))]" />
    </div>
  );
}

function CreatorAvatar({ profile, size = "lg" as const }: { profile: PublicProfile; size?: "sm" | "md" | "lg" }) {
  return (
    <AvatarBadge
      name={profile.user.name || "Creator"}
      avatarUrl={profile.user.image || ""}
      crop={{ x: profile.user.avatarCropX, y: profile.user.avatarCropY, zoom: profile.user.avatarCropZoom }}
      size={size}
    />
  );
}

export function BioCreatorPublicPage({ profile }: { profile: PublicProfile }) {
  const bio = createTextExcerpt(profile.user.bio, 160);
  const pinnedVideos = profile.pinnedVideos.slice(0, 3);
  const portfolioHref = getCreatorPortfolioHref(profile.user.username || "");

  return (
    <div className={pageShellClass}>
      <main className="mx-auto flex min-h-screen w-full max-w-[520px] flex-col justify-center px-4 py-6 sm:py-10">
        <Card className={`${cardClass} overflow-hidden rounded-[2rem] p-3 sm:p-4`}>
          <CreatorCover profile={profile} />
          <div className="-mt-10 flex flex-col items-center px-2 pb-2 text-center">
            <div className="rounded-full border-4 border-white bg-white shadow-[0_14px_34px_rgba(17,17,17,0.12)]">
              <CreatorAvatar profile={profile} />
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-[#111111] sm:text-4xl">{profile.user.name || "Creator"}</h1>
            <p className="mt-1 text-sm font-semibold text-[#525252]">@{profile.user.username}</p>
            {profile.user.role ? <p className="mt-2 text-base font-medium text-[#111111]">{profile.user.role}</p> : null}
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#525252]">{bio || "Creator belum menambahkan bio singkat."}</p>

            <SocialLinks
              className="mt-5 justify-center"
              websiteUrl={profile.user.websiteUrl}
              instagramUrl={profile.user.instagramUrl}
              youtubeUrl={profile.user.youtubeUrl}
              facebookUrl={profile.user.facebookUrl}
              threadsUrl={profile.user.threadsUrl}
              linkedinUrl={profile.user.linkedinUrl}
            />

            <div className="mt-6 w-full space-y-3">
              {pinnedVideos.map((video) => {
                const thumb = getVideoThumb(video);
                return (
                  <Link key={video.id} href={getVideoDetailHref(video.publicSlug)} className="group block">
                    <article className="flex min-h-[92px] items-center gap-3 rounded-[1.5rem] border border-[#E1E1DF] bg-[#FAFAF9] p-2 text-left transition hover:border-[#111111] hover:bg-white">
                      <div className="h-20 w-24 shrink-0 overflow-hidden rounded-[1rem] bg-[#EFEDEA]">
                        {thumb ? <Image src={thumb} alt={`Thumbnail ${video.title}`} width={180} height={120} className="h-full w-full object-cover" unoptimized /> : <div className="flex h-full items-center justify-center text-[#8A8A8A]"><Video className="h-5 w-5" /></div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap gap-1.5"><PlatformBadge>{video.outputType || "Portfolio"}</PlatformBadge><PlatformBadge>Public</PlatformBadge></div>
                        <h2 className="line-clamp-2 text-sm font-bold leading-5 text-[#111111]">{video.title}</h2>
                        <p className="mt-1 text-xs font-semibold text-[#525252]">Lihat Project</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-[#525252] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </article>
                  </Link>
                );
              })}

              {profile.user.customLinks.length === 0 && pinnedVideos.length === 0 ? (
                <p className="rounded-[1.25rem] border border-dashed border-[#DADADA] bg-[#FAFAF9] px-4 py-3 text-sm text-[#525252]">Creator belum menambahkan link.</p>
              ) : null}

              {profile.user.customLinks.filter((link) => link.enabled !== false && link.url).map((link) => {
                const safeUrl = getSafeExternalUrl(link.url);
                if (!safeUrl) return null;
                return (
                  <Link key={link.id} href={safeUrl} target="_blank" rel="noopener noreferrer" className={monoButtonClass}>
                    <span className="min-w-0"><span className="block truncate">{link.title}</span>{link.description ? <span className="mt-0.5 block truncate text-xs font-medium text-[#8A8A8A]">{link.description}</span> : null}</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0" />
                  </Link>
                );
              })}

              {profile.videos.length > 0 ? (
                <Link href={portfolioHref} className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#111111] px-5 text-sm font-bold text-white transition hover:bg-[#2b2b2b]">
                  Lihat Semua Portofolio
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>
        </Card>
      </main>
      <PublicFooter hidden={profile.whitelabelEnabled} />
    </div>
  );
}

export function PortfolioCreatorPublicPage({ profile, view = "grid" }: { profile: PublicProfile; view?: string }) {
  const isList = view === "list";
  const username = profile.user.username || "";
  const bioHref = getCreatorBioHref(username);

  return (
    <div className={pageShellClass}>
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link href={bioHref} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#DADADA] bg-white px-4 text-sm font-semibold text-[#111111]"><ArrowLeft className="h-4 w-4" />Kembali</Link>
          <PublicShareQrActions title={`Portfolio ${profile.user.name || "Creator"}`} pathname={getCreatorPortfolioHref(username)} showQr={false} />
        </div>

        <Card className={`${cardClass} mb-6 overflow-hidden rounded-[2rem] p-4 sm:p-5`}>
          <div className="grid gap-5 lg:grid-cols-[1fr_380px] lg:items-center">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="rounded-full border-4 border-[#F5F5F4] bg-white"><CreatorAvatar profile={profile} /></div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A8A8A]">Portfolio Creator</p>
                <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#111111] sm:text-4xl">{profile.user.name || "Creator"}</h1>
                <p className="mt-1 text-sm font-semibold text-[#525252]">@{profile.user.username} {profile.user.role ? `• ${profile.user.role}` : ""}</p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#525252]">{createTextExcerpt(profile.user.bio, 180) || "Bio singkat belum ditambahkan."}</p>
              </div>
            </div>
            <CreatorCover profile={profile} className="h-48" />
          </div>
        </Card>

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A8A8A]">Video Portfolio</p>
            <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em]">Karya public terbaru</h2>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto rounded-full border border-[#DADADA] bg-white p-1">
            <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#F0F0EF] px-3 text-sm font-semibold text-[#525252]"><Search className="h-4 w-4" />Semua</span>
            <Link href={`${getCreatorPortfolioHref(username)}?view=grid`} className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold ${!isList ? "bg-[#111111] text-white" : "text-[#525252]"}`}><Grid2X2 className="h-4 w-4" />Grid</Link>
            <Link href={`${getCreatorPortfolioHref(username)}?view=list`} className={`inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold ${isList ? "bg-[#111111] text-white" : "text-[#525252]"}`}><List className="h-4 w-4" />List</Link>
          </div>
        </div>

        {profile.videos.length === 0 ? (
          <Card className={`${cardClass} rounded-[2rem] p-8 text-center`}>
            <Video className="mx-auto h-9 w-9 text-[#8A8A8A]" />
            <p className="mt-3 text-sm font-medium text-[#525252]">Belum ada portfolio yang dipublikasikan.</p>
            <Link href={bioHref} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#111111] px-5 text-sm font-bold text-white">Kembali ke Bio</Link>
          </Card>
        ) : (
          <div className={isList ? "grid gap-3" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
            {profile.videos.map((video) => <PortfolioVideoCard key={video.id} video={video} list={isList} />)}
          </div>
        )}
      </main>
      <PublicFooter hidden={profile.whitelabelEnabled} />
    </div>
  );
}

function PortfolioVideoCard({ video, list }: { video: ProfileVideo; list?: boolean }) {
  const thumb = getVideoThumb(video);
  const sourceLabel = getSourceLabel(video.source as never);
  const postedLabel = formatDateLabel(video.createdAt.toISOString());

  return (
    <Link href={getVideoDetailHref(video.publicSlug)} className="group block">
      <article className={`${cardClass} h-full overflow-hidden rounded-[1.75rem] border p-3 transition hover:-translate-y-0.5 hover:border-[#111111] ${list ? "sm:flex sm:gap-4" : ""}`}>
        <div className={`overflow-hidden rounded-[1.25rem] bg-[#EFEDEA] ${list ? "sm:w-64 sm:shrink-0" : ""}`}>
          {thumb ? <Image src={thumb} alt={`Thumbnail ${video.title}`} width={720} height={405} sizes="(max-width: 768px) 100vw, 33vw" className="aspect-video w-full object-cover transition group-hover:scale-[1.02]" loading="lazy" unoptimized /> : <div className="flex aspect-video items-center justify-center text-[#8A8A8A]"><Video className="h-6 w-6" /></div>}
        </div>
        <div className="space-y-3 p-2">
          <div className="flex flex-wrap gap-2"><PlatformBadge>{sourceLabel}</PlatformBadge><PlatformBadge>{video.outputType || "General"}</PlatformBadge><PlatformBadge>{video.durationLabel || "-"}</PlatformBadge></div>
          <h3 className="line-clamp-2 text-lg font-bold leading-6 tracking-[-0.02em] text-[#111111]">{video.title}</h3>
          <p className="line-clamp-2 text-sm leading-6 text-[#525252]">{createTextExcerpt(video.description, 120) || "Deskripsi pendek belum ditambahkan."}</p>
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#8A8A8A]"><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{postedLabel}</span><span>Lihat Detail</span></div>
        </div>
      </article>
    </Link>
  );
}

export function VideoDetailPublicPage({ video }: { video: PublicVideo }) {
  const username = video.author?.username || "";
  const detailHref = getVideoDetailHref(video.publicSlug);
  const creatorHref = username ? getCreatorBioHref(username) : "/";
  const portfolioHref = username ? getCreatorPortfolioHref(username) : "/videos";
  const sourceLabel = getSourceLabel(video.source as never);

  return (
    <div className={pageShellClass}>
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href={portfolioHref} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#DADADA] bg-white px-4 text-sm font-semibold text-[#111111]"><ArrowLeft className="h-4 w-4" />Kembali ke Portfolio</Link>
          <Link href={video.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#111111] px-4 text-sm font-bold text-white">Buka Source <ArrowUpRight className="h-4 w-4" /></Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <Card className={`${cardClass} overflow-hidden rounded-[2rem] p-3 sm:p-4`}>
              <MediaPreviewCarousel manualThumbnailUrl={video.thumbnailUrl} fallbackThumbnailUrl={getAutoThumbnailFromVideoUrl(video.sourceUrl)} mainVideoUrl={video.sourceUrl} extraVideoUrls={video.extraVideoUrls} imageUrls={video.imageUrls} title={video.title} showHeading={false} showStatusBadge={Boolean(video.thumbnailUrl)} preferMainVideo aspectRatio={video.aspectRatio} />
            </Card>
            <Card className={`${cardClass} rounded-[2rem] p-5 sm:p-7`}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A8A8A]">Project Description</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight tracking-[-0.04em] text-[#111111] sm:text-5xl">{video.title}</h1>
              <p className="mt-5 whitespace-pre-line text-base leading-8 text-[#525252]">{video.description || "Deskripsi project belum ditambahkan."}</p>
            </Card>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
            <Card className={`${cardClass} rounded-[2rem] p-5`}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A8A8A]">Project Info</p>
              <div className="mt-4 grid gap-2">
                <InfoRow label="Output" value={video.outputType || "General"} />
                <InfoRow label="Platform" value={sourceLabel} />
                <InfoRow label="Durasi" value={video.durationLabel || "-"} />
                <InfoRow label="Status" value={video.visibility === "public" ? "Public / Selesai" : "Owner Preview"} />
                <InfoRow label="Tanggal" value={formatDateLabel(video.createdAt.toISOString())} />
              </div>
              {video.tags.length > 0 ? <div className="mt-4 flex flex-wrap gap-2">{video.tags.map((tag) => <PlatformBadge key={tag}>#{tag}</PlatformBadge>)}</div> : null}
            </Card>

            {video.author ? (
              <Card className={`${cardClass} rounded-[2rem] p-5`}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A8A8A]">Creator</p>
                <div className="mt-4 flex items-start gap-3">
                  <AvatarBadge name={video.author.name || "Creator"} avatarUrl={video.author.image || ""} crop={{ x: video.author.avatarCropX, y: video.author.avatarCropY, zoom: video.author.avatarCropZoom }} size="lg" />
                  <div className="min-w-0">
                    <h2 className="font-bold text-[#111111]">{video.author.name || "Creator"}</h2>
                    <p className="text-sm font-semibold text-[#525252]">@{video.author.username || "creator"}</p>
                    {video.author.role ? <p className="mt-1 text-sm text-[#525252]">{video.author.role}</p> : null}
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  <Link href={creatorHref} className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#111111] px-4 text-sm font-bold text-white">Lihat Bio</Link>
                  <Link href={portfolioHref} className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#DADADA] bg-white px-4 text-sm font-bold text-[#111111]">Lihat Semua Portfolio</Link>
                </div>
              </Card>
            ) : null}

            <Card className={`${cardClass} rounded-[2rem] p-5`}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A8A8A]">Share</p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#111111]">Bagikan Project</h2>
              <div className="mt-4"><PublicShareQrActions title={video.title} pathname={detailHref} /></div>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-[#E1E1DF] bg-[#FAFAF9] px-3 text-sm">
      <span className="font-medium text-[#8A8A8A]">{label}</span>
      <span className="text-right font-bold text-[#111111]">{value}</span>
    </div>
  );
}
