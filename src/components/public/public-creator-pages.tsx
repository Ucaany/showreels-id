import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Briefcase, CalendarDays, Grid2X2, Link2, List, Mail, MapPin, Phone, PlayCircle, Search, ShoppingBag, Video } from "lucide-react";
import { FaInstagram, FaTiktok, FaYoutube, FaWhatsapp, FaFacebookF, FaLinkedinIn, FaTelegram, FaDiscord, FaSpotify, FaBehance, FaDribbble, FaGithub, FaMedium, FaXTwitter } from "react-icons/fa6";
import { SiThreads, SiTiktok, SiShopee, SiGoogledrive } from "react-icons/si";
import { AvatarBadge } from "@/components/avatar-badge";
import { MediaPreviewCarousel } from "@/components/media-preview-carousel";
import { OwnerEditButton } from "@/components/owner-edit-button";
import { PublicShareQrActions } from "@/components/public/public-share-qr-actions";
import { SocialLinks } from "@/components/social-links";
import { Card } from "@/components/ui/card";
import { formatDateLabel } from "@/lib/helpers";
import { getBackgroundImageCropStyle } from "@/lib/image-crop";
import { isProfileVerified } from "@/lib/profile-utils";
import { createTextExcerpt, getCreatorBioHref, getCreatorPortfolioHref, getSafeExternalUrl, getVideoDetailHref } from "@/lib/public-route-utils";
import { getAutoThumbnailFromVideoUrl, getSourceLabel } from "@/lib/video-utils";
import { VerifiedBadge } from "@/components/verified-badge";

type PublicProfile = NonNullable<Awaited<ReturnType<typeof import("@/server/public-data").getPublicProfile>>>;
type PublicVideo = NonNullable<Awaited<ReturnType<typeof import("@/server/public-data").getPublicVideo>>>;
type ProfileVideo = PublicProfile["videos"][number];

const pageShellClass = "min-h-screen overflow-x-hidden bg-[#F5F5F4] text-[#111111]";
const cardClass = "border-[#E1E1DF] bg-white shadow-[0_18px_50px_rgba(17,17,17,0.06)]";
const darkButtonClass = "bg-[#111111] !text-white shadow-[0_14px_30px_rgba(17,17,17,0.16)] transition hover:bg-[#1E1E1E] focus:outline-none focus:ring-2 focus:ring-[#111111]/25 disabled:bg-[#3A3A3A] disabled:text-[#DADADA] [&_svg]:text-white";
const monoButtonClass = "inline-flex min-h-[52px] w-full items-center gap-3 rounded-[1.25rem] border border-[#E1E1DF] bg-white px-4 text-sm font-semibold text-[#111111] transition hover:-translate-y-0.5 hover:border-[#111111] hover:shadow-[0_12px_28px_rgba(17,17,17,0.08)] focus:outline-none focus:ring-2 focus:ring-[#111111]/20";

const LINK_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  link: Link2,
  website: Link2,
  custom: Link2,
  instagram: FaInstagram,
  tiktok: FaTiktok,
  tiktokshop: SiTiktok,
  youtube: FaYoutube,
  whatsapp: FaWhatsapp,
  facebook: FaFacebookF,
  x: FaXTwitter,
  threads: SiThreads,
  linkedin: FaLinkedinIn,
  telegram: FaTelegram,
  discord: FaDiscord,
  spotify: FaSpotify,
  gdrive: SiGoogledrive,
  tokopedia: ShoppingBag,
  shopee: SiShopee,
  email: Mail,
  phone: Phone,
  maps: MapPin,
  portfolio: Briefcase,
  video: PlayCircle,
  behance: FaBehance,
  dribbble: FaDribbble,
  github: FaGithub,
  medium: FaMedium,
};

function getLinkIcon(link: { iconKey?: string; platform?: string }) {
  const key = link.iconKey || link.platform || "link";
  return LINK_ICON_MAP[key] || Link2;
}

function getVideoThumb(video: Pick<ProfileVideo, "thumbnailUrl" | "sourceUrl">) {
  return video.thumbnailUrl || getAutoThumbnailFromVideoUrl(video.sourceUrl) || "";
}

function PlatformBadge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-[#DADADA] bg-[#F0F0EF] px-2.5 py-1 text-[11px] font-semibold text-[#525252]">{children}</span>;
}

function PublicFooter({ hidden }: { hidden?: boolean }) {
  if (hidden) return null;
  return (
    <footer className="px-4 pb-8 pt-10 text-center text-xs font-medium text-[#8A8A8A] sm:pt-14">
      Made with <span className="font-semibold text-[#111111]">Showreels.id</span>
    </footer>
  );
}

function CreatorCover({ profile, className = "h-36", soft = false, transparent = false }: { profile: PublicProfile; className?: string; soft?: boolean; transparent?: boolean }) {
  const autoCoverImage = getVideoThumb(profile.videos[0] || { thumbnailUrl: "", sourceUrl: "" });
  const coverImage = profile.user.coverImageUrl || autoCoverImage;

  return (
    <div className={`relative overflow-hidden rounded-[1.75rem] border border-[#E1E1DF] bg-[radial-gradient(circle_at_20%_20%,#ffffff_0%,#EFEDEA_35%,#d8d6d1_100%)] ${className}`}>
      {coverImage ? (
        <div
          className={`absolute inset-0 ${soft ? "opacity-70 blur-[0.2px]" : ""}`}
          style={getBackgroundImageCropStyle(
            coverImage,
            { x: profile.user.coverCropX, y: profile.user.coverCropY, zoom: profile.user.coverCropZoom }
          )}
        />
      ) : null}
      {transparent ? (
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white/60" />
      ) : (
        <div className={soft ? "absolute inset-0 bg-white/65 backdrop-blur-[1px]" : "absolute inset-0 bg-[linear-gradient(180deg,rgba(245,245,244,0.18),rgba(17,17,17,0.16))]"} />
      )}
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
      {profile.isOwner && <OwnerEditButton />}
      <main className="mx-auto flex min-h-screen w-full max-w-[460px] flex-col justify-center px-4 py-6 min-[481px]:max-w-[560px] sm:px-5 sm:py-10 lg:max-w-[640px]">
        <Card className={`${cardClass} overflow-hidden rounded-[1.75rem] p-4 sm:rounded-[2rem] sm:p-5 lg:p-6`}>
          {/* Cover with semi-transparent overlay */}
          <CreatorCover profile={profile} transparent className="h-[132px] min-[375px]:h-[152px] min-[431px]:h-[176px] sm:h-[190px]" />

          {/* Avatar overlapping cover */}
          <div className="-mt-12 flex flex-col items-center text-center sm:-mt-14">
            <div className="relative z-10 rounded-full border-4 border-white bg-white shadow-[0_14px_34px_rgba(17,17,17,0.12)]">
              <CreatorAvatar profile={profile} />
            </div>

            {/* Social media icons - bento style, centered */}
            <SocialLinks className="mt-5 justify-center" balanced websiteUrl={profile.user.websiteUrl} instagramUrl={profile.user.instagramUrl} youtubeUrl={profile.user.youtubeUrl} facebookUrl={profile.user.facebookUrl} threadsUrl={profile.user.threadsUrl} linkedinUrl={profile.user.linkedinUrl} />

            {/* Name with verified badge */}
            <h1 className="mt-5 max-w-full text-3xl font-bold tracking-[-0.04em] text-[#111111] sm:text-4xl">
              {profile.user.name || "Creator"}
              {isProfileVerified(profile) && <VerifiedBadge className="ml-2 align-middle" />}
            </h1>

            {/* Role and username — single line */}
            <p className="mt-2 text-sm font-semibold text-[#525252]">
              {profile.user.role ? <span className="text-base font-medium text-[#111111]">{profile.user.role}</span> : null}
              {profile.user.role ? <span className="mx-1.5 text-[#DADADA]">•</span> : null}
              <span>@{profile.user.username}</span>
            </p>

            {/* Bio */}
            <p className="mt-4 max-w-[32rem] text-[15px] leading-tight text-[#525252] sm:text-base">{bio || "Creator belum menambahkan bio singkat."}</p>

            {/* Buttons / Links */}
            <div className="mt-7 w-full space-y-3 sm:space-y-4">
              {pinnedVideos.map((video) => {
                const thumb = getVideoThumb(video);
                return (
                  <Link key={video.id} href={getVideoDetailHref(video.publicSlug)} className="group block">
                    <article className="flex min-h-[104px] items-center gap-3 rounded-[1.5rem] border border-[#E1E1DF] bg-[#FAFAF9] p-2.5 text-left transition hover:border-[#111111] hover:bg-white max-[359px]:block">
                      <div className="h-24 w-28 shrink-0 overflow-hidden rounded-[1.15rem] bg-[#EFEDEA] max-[359px]:mb-3 max-[359px]:h-36 max-[359px]:w-full">
                        {thumb ? <Image src={thumb} alt={`Thumbnail ${video.title}`} width={220} height={148} className="h-full w-full object-cover" unoptimized /> : <div className="flex h-full items-center justify-center text-[#8A8A8A]"><Video className="h-5 w-5" /></div>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap gap-1.5"><PlatformBadge>{video.outputType || "Portfolio"}</PlatformBadge><PlatformBadge>Public</PlatformBadge></div>
                        <h2 className="line-clamp-2 text-[15px] font-bold leading-5 text-[#111111]">{video.title}</h2>
                        <p className="mt-1 text-xs font-semibold text-[#525252]">Lihat Project</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-[#525252] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 max-[359px]:mt-2" />
                    </article>
                  </Link>
                );
              })}

              {profile.user.customLinks.length === 0 && pinnedVideos.length === 0 ? (
                <p className="rounded-[1.25rem] border border-dashed border-[#DADADA] bg-[#FAFAF9] px-4 py-4 text-center text-sm text-[#525252]">Creator belum menambahkan link.</p>
              ) : null}

              {profile.user.customLinks.filter((link) => link.enabled !== false && link.url).map((link) => {
                const safeUrl = getSafeExternalUrl(link.url);
                if (!safeUrl) return null;
                const IconComp = getLinkIcon(link);
                return (
                  <Link key={link.id} href={safeUrl} target="_blank" rel="noopener noreferrer" className={monoButtonClass}>
                    <IconComp className="h-5 w-5 shrink-0 text-[#525252]" />
                    <span className="min-w-0 flex-1 text-center"><span className="block truncate">{link.title}</span>{link.description ? <span className="mt-0.5 block truncate text-xs font-medium text-[#8A8A8A]">{link.description}</span> : null}</span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-[#525252]" />
                  </Link>
                );
              })}

              {profile.videos.length > 0 ? (
                <Link href={portfolioHref} className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-bold sm:min-h-[56px] ${darkButtonClass}`}>
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
        {/* Top bar: Back + Share */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link href={bioHref} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#E7E5E4] bg-white px-4 text-sm font-semibold text-[#111111] shadow-sm transition hover:border-[#111111] hover:shadow-md"><ArrowLeft className="h-4 w-4" />Kembali</Link>
          <PublicShareQrActions title={`Portfolio ${profile.user.name || "Creator"}`} pathname={getCreatorPortfolioHref(username)} showQr={false} compact />
        </div>

        {/* Profile Header — Clean card (no cover) */}
        <Card className="mb-6 overflow-hidden rounded-3xl border border-[#E7E5E4] bg-white p-4 shadow-[0_18px_50px_rgba(17,17,17,0.06)] sm:p-5 lg:p-6">
          {/* Mobile: centered avatar + info */}
          <div className="flex flex-col items-center text-center lg:hidden">
            <div className="rounded-full border-4 border-white bg-white shadow-[0_12px_26px_rgba(17,17,17,0.12)]">
              <CreatorAvatar profile={profile} />
            </div>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#8A8A8A]">Portfolio Creator</p>
            <h1 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[#111111] sm:text-3xl">
              {profile.user.name || "Creator"}
              {isProfileVerified(profile) && <VerifiedBadge className="ml-2 align-middle" />}
            </h1>
            <p className="mt-1 text-sm font-semibold text-[#525252]">@{profile.user.username} {profile.user.role ? `• ${profile.user.role}` : ""}</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#525252]">{createTextExcerpt(profile.user.bio, 180) || "Bio singkat belum ditambahkan."}</p>
          </div>

          {/* Desktop: horizontal layout with avatar + info */}
          <div className="hidden lg:block">
            <div className="relative overflow-hidden rounded-2xl border border-[#E7E5E4] bg-[#FAFAF9] p-7">
              <div className="flex items-center gap-5">
                <div className="shrink-0 rounded-full border-4 border-white bg-white shadow-[0_12px_26px_rgba(17,17,17,0.12)]"><CreatorAvatar profile={profile} /></div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A8A8A]">Portfolio Creator</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-[#111111] xl:text-4xl">
                    {profile.user.name || "Creator"}
                    {isProfileVerified(profile) && <VerifiedBadge className="ml-2 align-middle" />}
                  </h1>
                  <p className="mt-1 text-sm font-semibold text-[#525252]">@{profile.user.username} {profile.user.role ? `• ${profile.user.role}` : ""}</p>
                  <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[#525252]">{createTextExcerpt(profile.user.bio, 180) || "Bio singkat belum ditambahkan."}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Filter / Toggle Bar */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A8A8A]">Video Portfolio</p>
            <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em] sm:text-3xl">Karya public terbaru</h2>
          </div>
          <div className="flex max-w-full items-center gap-1.5 overflow-x-auto rounded-full border border-[#E7E5E4] bg-white p-1 shadow-sm">
            <span className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-[#E7E5E4] bg-[#F5F5F4] px-3.5 text-sm font-semibold text-[#525252]"><Search className="h-4 w-4" />Semua</span>
            <Link href={`${getCreatorPortfolioHref(username)}?view=grid`} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition ${!isList ? "bg-[#111111] text-white shadow-[0_4px_12px_rgba(17,17,17,0.2)]" : "border border-[#E7E5E4] bg-white text-[#525252] hover:border-[#111111]"}`}><Grid2X2 className="h-4 w-4" />Grid</Link>
            <Link href={`${getCreatorPortfolioHref(username)}?view=list`} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition ${isList ? "bg-[#111111] text-white shadow-[0_4px_12px_rgba(17,17,17,0.2)]" : "border border-[#E7E5E4] bg-white text-[#525252] hover:border-[#111111]"}`}><List className="h-4 w-4" />List</Link>
          </div>
        </div>

        {/* Video Grid */}
        {profile.videos.length === 0 ? (
          <Card className="rounded-3xl border border-[#E7E5E4] bg-white p-8 text-center shadow-[0_18px_50px_rgba(17,17,17,0.06)]">
            <Video className="mx-auto h-9 w-9 text-[#8A8A8A]" />
            <p className="mt-3 text-sm font-medium text-[#525252]">Belum ada portfolio yang dipublikasikan.</p>
            <Link href={bioHref} className={`mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-[#E7E5E4] px-5 text-sm font-bold ${darkButtonClass}`}>Kembali ke Bio</Link>
          </Card>
        ) : (
          <div className={isList ? "grid gap-4" : "grid gap-4 sm:grid-cols-2 xl:grid-cols-3"}>
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
    <Link href={getVideoDetailHref(video.publicSlug)} className="group block min-w-0">
      <article className={`h-full rounded-3xl border border-[#E7E5E4] bg-white p-3 shadow-[0_18px_50px_rgba(17,17,17,0.06)] transition hover:-translate-y-1 hover:border-[#111111] hover:shadow-[0_20px_40px_rgba(17,17,17,0.1)] sm:p-4 ${list ? "md:flex md:gap-4" : ""}`}>
        <div className={`overflow-hidden rounded-xl bg-[#EFEDEA] ${list ? "md:w-72 md:shrink-0" : ""}`}>
          {thumb ? <Image src={thumb} alt={`Thumbnail ${video.title}`} width={720} height={405} sizes="(max-width: 768px) 100vw, 33vw" className="aspect-video w-full object-cover transition group-hover:scale-[1.02]" loading="lazy" unoptimized /> : <div className="flex aspect-video items-center justify-center text-[#8A8A8A]"><Video className="h-6 w-6" /></div>}
        </div>
        <div className="mt-3 space-y-2.5 sm:mt-4">
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center rounded-full border border-[#E7E5E4] bg-[#F5F5F4] px-2.5 py-1 text-[11px] font-semibold text-[#525252]">{sourceLabel}</span>
            <span className="inline-flex items-center rounded-full border border-[#E7E5E4] bg-[#F5F5F4] px-2.5 py-1 text-[11px] font-semibold text-[#525252]">{video.outputType || "General"}</span>
            <span className="inline-flex items-center rounded-full border border-[#E7E5E4] bg-[#F5F5F4] px-2.5 py-1 text-[11px] font-semibold text-[#525252]">{video.durationLabel || "-"}</span>
          </div>
          <h3 className="line-clamp-2 text-base font-bold leading-snug tracking-[-0.02em] text-[#111111]">{video.title}</h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-[#525252]">{createTextExcerpt(video.description, 140) || "Deskripsi pendek belum ditambahkan."}</p>
          <div className="flex items-center justify-between gap-3 pt-1 text-xs font-semibold">
            <span className="inline-flex items-center gap-1 text-[#8A8A8A]"><CalendarDays className="h-3.5 w-3.5" />{postedLabel}</span>
            <span className="inline-flex items-center gap-1 text-[#111111] transition group-hover:gap-1.5">Lihat Detail <ArrowUpRight className="h-3.5 w-3.5" /></span>
          </div>
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
          <Link href={video.sourceUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold max-[420px]:w-full max-[420px]:justify-center ${darkButtonClass}`}>Buka Source <ArrowUpRight className="h-4 w-4" /></Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <Card className={`${cardClass} overflow-hidden rounded-[1.75rem] p-3 sm:rounded-[2rem] sm:p-4`}>
              <MediaPreviewCarousel manualThumbnailUrl={video.thumbnailUrl} fallbackThumbnailUrl={getAutoThumbnailFromVideoUrl(video.sourceUrl)} mainVideoUrl={video.sourceUrl} extraVideoUrls={video.extraVideoUrls} imageUrls={video.imageUrls} title={video.title} showHeading={false} showStatusBadge={Boolean(video.thumbnailUrl)} preferMainVideo aspectRatio={video.aspectRatio} />
            </Card>
            <Card className={`${cardClass} rounded-[1.75rem] p-5 sm:rounded-[2rem] sm:p-7`}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8A8A8A]">Project Description</p>
              <h1 className="mt-3 text-[2rem] font-bold leading-tight tracking-[-0.04em] text-[#111111] sm:text-5xl">{video.title}</h1>
              <p className="mt-5 whitespace-pre-line text-base leading-8 text-[#525252]">{video.description || "Deskripsi project belum ditambahkan."}</p>
            </Card>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-5 lg:self-start">
            <Card className={`${cardClass} rounded-[1.75rem] p-5 sm:rounded-[2rem]`}>
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
              <Card className={`${cardClass} rounded-[1.75rem] p-5 sm:rounded-[2rem]`}>
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
                  <Link href={creatorHref} className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-4 text-sm font-bold ${darkButtonClass}`}>Lihat Bio</Link>
                  <Link href={portfolioHref} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#DADADA] bg-white px-4 text-sm font-bold text-[#111111]">Lihat Semua Portofolio</Link>
                </div>
              </Card>
            ) : null}

            <Card className={`${cardClass} rounded-[1.75rem] p-5 sm:rounded-[2rem]`}>
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
    <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#E1E1DF] bg-[#FAFAF9] px-3 py-2 text-sm">
      <span className="font-medium text-[#8A8A8A]">{label}</span>
      <span className="min-w-0 break-words text-right font-bold text-[#111111]">{value}</span>
    </div>
  );
}
