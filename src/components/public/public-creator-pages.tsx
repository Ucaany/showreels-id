import Image from "next/image";
import Link from "next/link";
import { PrefetchOnHoverLink } from "@/components/public/prefetch-on-hover-link";
import { memo } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Briefcase, CalendarDays, CheckCircle2, Clapperboard, Clock3, Film, Grid2X2, Layers, Link2, List, Mail, MapPin, Phone, PlayCircle, ShoppingBag, Sparkles, Tag, Video } from "lucide-react";
import { FaInstagram, FaTiktok, FaYoutube, FaWhatsapp, FaFacebookF, FaLinkedinIn, FaTelegram, FaDiscord, FaSpotify, FaBehance, FaDribbble, FaGithub, FaMedium, FaXTwitter } from "react-icons/fa6";
import { SiThreads, SiTiktok, SiShopee, SiGoogledrive } from "react-icons/si";
import { AvatarBadge } from "@/components/avatar-badge";
import { MediaPreviewCarousel } from "@/components/media-preview-carousel";
import { OwnerEditButton } from "@/components/owner-edit-button";
import { PublicShareQrActions } from "@/components/public/public-share-qr-actions";
import { SocialLinks } from "@/components/social-links";
import { Card } from "@/components/ui/card";
import { optimizeThumbnailSrc } from "@/lib/cdn-image";
import { formatDateLabel } from "@/lib/helpers";
import { getBackgroundImageCropStyle } from "@/lib/image-crop";
import { isProfileVerified } from "@/lib/profile-utils";
import { createTextExcerpt, getCreatorBioHref, getCreatorPortfolioHref, getSafeExternalUrl, getVideoDetailHref } from "@/lib/public-route-utils";
import { DEFAULT_THUMBNAIL_URL, getAutoThumbnailFromVideoUrl, getSourceLabel, resolveThumbnailUrl } from "@/lib/video-utils";
import { VerifiedBadge } from "@/components/verified-badge";

type PublicProfile = NonNullable<Awaited<ReturnType<typeof import("@/server/public-data").getPublicProfile>>>;
type PublicVideo = NonNullable<Awaited<ReturnType<typeof import("@/server/public-data").getPublicVideo>>>;
type ProfileVideo = PublicProfile["videos"][number];

const pageShellClass = "min-h-screen overflow-x-hidden bg-[#F5F5F4] text-[#111111]";
const cardClass = "border-[#E1E1DF] bg-white shadow-[0_18px_50px_rgba(17,17,17,0.06)]";
const darkButtonClass = "bg-[#111111] !text-white shadow-[0_14px_30px_rgba(17,17,17,0.16)] transition hover:bg-[#1E1E1E] focus:outline-none focus:ring-2 focus:ring-[#111111]/25 disabled:bg-[#3A3A3A] disabled:text-[#DADADA] [&_svg]:text-white";
const monoButtonClass = "inline-flex min-h-[52px] w-full min-w-0 items-center gap-3 rounded-[1.25rem] border border-[#E1E1DF] bg-white px-4 text-sm font-semibold text-[#111111] transition hover:-translate-y-0.5 hover:border-[#111111] hover:shadow-[0_12px_28px_rgba(17,17,17,0.08)] focus:outline-none focus:ring-2 focus:ring-[#111111]/20";

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

function getVideoThumb(video: Pick<ProfileVideo, "thumbnailUrl" | "previewImage" | "sourceUrl">) {
  return optimizeThumbnailSrc(
    resolveThumbnailUrl({
      customThumbnailUrl: video.thumbnailUrl,
      autoThumbnailUrl: video.previewImage,
      platformThumbnailUrl: getAutoThumbnailFromVideoUrl(video.sourceUrl),
      fallbackDefault: DEFAULT_THUMBNAIL_URL,
    }),
    { width: 640, height: 360 }
  );
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
  const autoCoverImage = getVideoThumb(profile.videos[0] || { thumbnailUrl: "", previewImage: "", sourceUrl: "" });
  const coverImage = optimizeThumbnailSrc(profile.user.coverImageUrl || autoCoverImage, {
    width: 1280,
    height: 720,
  });

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
  const hasCover = Boolean(profile.user.coverImageUrl);

  return (
    <div className={`${pageShellClass} relative`}>
      {/* Soft blue gradient background — opacity < 40% */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.35]"
        style={{ background: "radial-gradient(ellipse 80% 60% at 15% 20%, #B8E4F0 0%, transparent 70%), radial-gradient(ellipse 70% 50% at 85% 15%, #C5E8F4 0%, transparent 65%), radial-gradient(ellipse 60% 70% at 50% 80%, #D0ECF6 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 75%, #BDE5F2 0%, transparent 55%)" }}
      />
      {profile.isOwner && <OwnerEditButton />}
      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[460px] flex-col justify-center px-4 py-6 min-[481px]:max-w-[560px] sm:px-5 sm:py-10 lg:max-w-[640px]">
        <Card className={`${cardClass} overflow-hidden rounded-[1.75rem] p-4 sm:rounded-[2rem] sm:p-5 lg:p-6`}>
          {/* Cover — only rendered if user uploaded a cover image */}
          {hasCover && (
            <CreatorCover profile={profile} transparent className="h-[132px] min-[375px]:h-[152px] min-[431px]:h-[176px] sm:h-[190px]" />
          )}

          {/* Avatar overlapping cover (or flush to top if no cover) */}
          <div className={`flex flex-col items-center text-center ${hasCover ? "-mt-12 sm:-mt-14" : "mt-2"}`}>
            <div className="relative z-10 rounded-full border-4 border-white bg-white shadow-[0_14px_34px_rgba(17,17,17,0.12)]">
              <CreatorAvatar profile={profile} />
            </div>

            {/* Name with verified badge */}
            <h1 className="text-safe mt-5 max-w-full text-3xl font-bold text-[#111111] sm:text-4xl">
              {profile.user.name || "Creator"}
              {isProfileVerified(profile) && <VerifiedBadge className="ml-2 align-middle" />}
            </h1>

            {/* Role and username — single line */}
            <p className="text-safe mt-2 max-w-full text-sm font-semibold text-[#525252]">
              {profile.user.role ? <span className="text-base font-medium text-[#111111]">{profile.user.role}</span> : null}
              {profile.user.role ? <span className="mx-1.5 text-[#DADADA]">•</span> : null}
              <span>@{profile.user.username}</span>
            </p>

            {/* Social media icons */}
            <SocialLinks className="mt-5 justify-center" balanced websiteUrl={profile.user.websiteUrl} instagramUrl={profile.user.instagramUrl} youtubeUrl={profile.user.youtubeUrl} facebookUrl={profile.user.facebookUrl} threadsUrl={profile.user.threadsUrl} linkedinUrl={profile.user.linkedinUrl} />

            {/* Bio / Description */}
            <p className="text-safe mt-4 max-w-[32rem] text-[15px] leading-tight text-[#525252] sm:text-base">{bio || "Bio belum ditambahkan."}</p>

            {/* Buttons / Links */}
            <div className="mt-7 w-full space-y-3 sm:space-y-4">
              {pinnedVideos.map((video) => {
                const thumb = getVideoThumb(video);
                return (
                  <Link key={video.id} href={getVideoDetailHref(video.publicSlug)} className="group block">
                    <article className="flex min-h-[104px] items-center gap-3 rounded-[1.5rem] border border-[#E1E1DF] bg-[#FAFAF9] p-2.5 text-left transition hover:border-[#111111] hover:bg-white max-[359px]:block">
                      <div className="h-24 w-28 shrink-0 overflow-hidden rounded-[1.15rem] bg-[#EFEDEA] max-[359px]:mb-3 max-[359px]:h-36 max-[359px]:w-full">
                        {thumb ? <Image src={thumb} alt={`Thumbnail ${video.title}`} width={220} height={148} className="h-full w-full object-cover" priority={pinnedVideos.indexOf(video) === 0} /> : <div className="flex h-full items-center justify-center text-[#8A8A8A]"><Video className="h-5 w-5" /></div>}
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
                <p className="rounded-[1.25rem] border border-dashed border-[#DADADA] bg-[#FAFAF9] px-4 py-4 text-center text-sm text-[#525252]">Belum ada link yang ditambahkan.</p>
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

              {profile.videos.length > 0 && profile.user.showPortfolioButton !== false ? (
                <Link href={portfolioHref} className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-bold sm:min-h-[56px] ${darkButtonClass}`}>
                  Lihat Semua Portofolio
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>
        </Card>
      </main>
      <div className="relative z-10"><PublicFooter hidden={profile.whitelabelEnabled} /></div>
    </div>
  );
}

export function PortfolioCreatorPublicPage({ profile, view = "grid" }: { profile: PublicProfile; view?: string }) {
  const isList = view === "list";
  const username = profile.user.username || "";
  const bioHref = getCreatorBioHref(username);
  const creatorName = profile.user.name || "Creator";

  return (
    <div className="min-h-screen overflow-x-hidden text-[#111111]">
      {/* CSS-only gradient background — responsive, no images */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 15% 20%, rgba(184,228,240,0.35) 0%, transparent 70%),
            radial-gradient(ellipse 70% 50% at 85% 15%, rgba(197,232,244,0.30) 0%, transparent 65%),
            radial-gradient(ellipse 60% 70% at 50% 85%, rgba(208,236,246,0.28) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 80% 75%, rgba(189,229,242,0.25) 0%, transparent 55%),
            linear-gradient(180deg, #FAFCFE 0%, #F0F7FB 40%, #FAFCFE 100%)
          `,
        }}
      />
      {/* Animated gradient layers — flat, wide, not circular */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.30] max-sm:hidden motion-reduce:hidden">
        <div className="absolute -left-[20%] -top-[30%] h-[70vh] w-[140%] bg-[radial-gradient(ellipse_80%_50%_at_30%_40%,#87CEEB_0%,transparent_70%)] animate-[portfolio-blob-move_20s_ease-in-out_infinite]" />
        <div className="absolute -right-[20%] top-[20%] h-[60vh] w-[140%] bg-[radial-gradient(ellipse_70%_45%_at_70%_50%,#B8E4F0_0%,transparent_65%)] animate-[portfolio-blob-move_25s_ease-in-out_infinite_reverse]" />
        <div className="absolute bottom-0 left-0 h-[50vh] w-full bg-[radial-gradient(ellipse_90%_40%_at_50%_80%,#D0ECF6_0%,transparent_60%)] animate-[portfolio-blob-move_30s_ease-in-out_infinite]" />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        {/* ── Profile Header Card ── */}
          <section className="mb-10 overflow-hidden rounded-[1.75rem] border border-[#E7E5E4]/60 bg-white/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_12px_32px_rgba(17,17,17,0.05)] backdrop-blur-sm sm:rounded-[2rem] sm:p-8 lg:p-10">
          <div className="flex flex-col items-center text-center">
            {/* (a) Avatar */}
            <div className="rounded-full border-[3px] border-white bg-white shadow-[0_8px_24px_rgba(17,17,17,0.10)]">
              <CreatorAvatar profile={profile} />
            </div>

            {/* (b) Name + Verified Badge */}
            <h1 className="text-safe mt-5 text-[1.65rem] font-extrabold text-[#111111] sm:text-3xl lg:text-[2.1rem]">
              {creatorName}
              {isProfileVerified(profile) && <VerifiedBadge className="ml-2 inline-block align-middle" />}
            </h1>

            {/* (c) Role • @username */}
            <p className="text-safe mt-1.5 max-w-full text-sm text-[#6B6B6B] sm:text-[15px]">
              {profile.user.role ? <span className="font-semibold text-[#333333]">{profile.user.role}</span> : null}
              {profile.user.role ? <span className="mx-1.5 text-[#D4D4D4]">·</span> : null}
              <span className="font-medium">@{username}</span>
            </p>

            {/* Social platform icons */}
            <SocialLinks
              className="mt-4 justify-center"
              balanced
              websiteUrl={profile.user.websiteUrl}
              instagramUrl={profile.user.instagramUrl}
              youtubeUrl={profile.user.youtubeUrl}
              facebookUrl={profile.user.facebookUrl}
              threadsUrl={profile.user.threadsUrl}
              linkedinUrl={profile.user.linkedinUrl}
            />

            {/* (d) Description — centered, aligned neatly */}
            <p className="mx-auto mt-4 max-w-md text-center text-[13.5px] leading-relaxed text-[#6B6B6B] sm:max-w-lg sm:text-sm">
              {createTextExcerpt(profile.user.bio, 200) || "Bio belum ditambahkan."}
            </p>

            {/* (e) Buttons: Back to Bio + Dashboard (conditional) */}
            <div className="mt-6 flex w-full flex-wrap items-center justify-center gap-2.5">
              <Link
                href={bioHref}
                  className="inline-flex min-h-[42px] min-w-0 items-center justify-center gap-2 rounded-full border border-[#E7E5E4] bg-white px-5 text-[13px] font-semibold text-[#333333] shadow-sm transition hover:border-[#111111] hover:shadow-md max-[380px]:w-full"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Bio
              </Link>
              {profile.isOwner && (
                <Link
                  href="/dashboard"
                  className="inline-flex min-h-[42px] min-w-0 items-center justify-center gap-2 rounded-full bg-[#111111] px-5 text-[13px] font-semibold shadow-[0_8px_20px_rgba(17,17,17,0.15)] transition hover:bg-[#1E1E1E] hover:shadow-[0_12px_28px_rgba(17,17,17,0.2)] max-[380px]:w-full"
                  style={{ color: '#ffffff' }}
                >
                  Kembali ke Dashboard
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ── Section Title + View Toggle ── */}
          <div className="mb-5 rounded-2xl border border-[#E7E5E4]/50 bg-white/70 px-4 py-4 shadow-sm backdrop-blur-sm sm:rounded-[1.25rem] sm:px-5">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-[-0.02em] text-[#111111] sm:text-xl">
                Portfolio
              </h2>
              <p className="mt-0.5 text-[12px] font-medium text-[#9A9A9A] sm:text-[13px]">
                {(profile.totalVideos ?? profile.videos.length)} project
              </p>
            </div>
            <div className="flex shrink-0 items-center rounded-xl border border-[#EBEBEB] bg-[#F7F7F7] p-0.5">
              <Link
                href={`${getCreatorPortfolioHref(username)}?view=grid&page=1`}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition sm:text-[13px] ${
                  !isList
                    ? "bg-[#111111] shadow-sm"
                    : "text-[#6B6B6B] hover:text-[#111111]"
                }`}
                {...(!isList ? { style: { color: '#ffffff' } } : {})}
              >
                <Grid2X2 className="h-3.5 w-3.5" />
                <span className="hidden min-[360px]:inline">Grid</span>
              </Link>
              <Link
                href={`${getCreatorPortfolioHref(username)}?view=list&page=1`}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12px] font-semibold transition sm:text-[13px] ${
                  isList
                    ? "bg-[#111111] shadow-sm"
                    : "text-[#6B6B6B] hover:text-[#111111]"
                }`}
                {...(isList ? { style: { color: '#ffffff' } } : {})}
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden min-[360px]:inline">List</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Video Grid / List ── */}
        {profile.videos.length === 0 ? (
          <div className="rounded-[1.75rem] border border-[#E7E5E4]/60 bg-white/90 p-10 text-center shadow-sm backdrop-blur-sm">
            <Video className="mx-auto h-10 w-10 text-[#C4C4C4]" />
            <p className="mt-4 text-sm font-medium text-[#6B6B6B]">Belum ada karya yang dipublikasikan.</p>
            <Link
              href={bioHref}
              className="mt-5 inline-flex min-h-[42px] items-center justify-center rounded-full bg-[#111111] px-6 text-[13px] font-semibold shadow-[0_8px_20px_rgba(17,17,17,0.15)] transition hover:bg-[#1E1E1E]"
              style={{ color: '#ffffff' }}
            >
              Kembali ke Bio
            </Link>
          </div>
        ) : (
          <div className={isList ? "grid min-w-0 gap-3 sm:gap-4" : "grid min-w-0 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3"}>
            {profile.videos.map((video) => (
              <PortfolioVideoCard key={video.id} video={video} list={isList} />
            ))}
          </div>
        )}
        {profile.totalPages && profile.totalPages > 1 ? (
          <nav className="mt-7 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination portfolio">
            <Link
              href={`${getCreatorPortfolioHref(username)}?view=${isList ? "list" : "grid"}&page=${Math.max(1, (profile.page || 1) - 1)}`}
              className={`inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold ${
                profile.hasPreviousPage
                  ? "border-[#E7E5E4] bg-white text-[#111111] hover:border-[#111111]"
                  : "pointer-events-none border-[#ECECEC] bg-[#F6F6F6] text-[#9A9A9A]"
              }`}
              aria-disabled={!profile.hasPreviousPage}
            >
              Previous
            </Link>
            <span className="px-3 text-xs font-semibold text-[#6B6B6B]">
              Page {profile.page || 1} / {profile.totalPages}
            </span>
            <Link
              href={`${getCreatorPortfolioHref(username)}?view=${isList ? "list" : "grid"}&page=${(profile.page || 1) + 1}`}
              className={`inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-semibold ${
                profile.hasNextPage
                  ? "border-[#E7E5E4] bg-white text-[#111111] hover:border-[#111111]"
                  : "pointer-events-none border-[#ECECEC] bg-[#F6F6F6] text-[#9A9A9A]"
              }`}
              aria-disabled={!profile.hasNextPage}
            >
              Next
            </Link>
          </nav>
        ) : null}
      </main>

      <div className="relative z-10">
        <PublicFooter hidden={profile.whitelabelEnabled} />
      </div>
    </div>
  );
}

const PortfolioVideoCard = memo(function PortfolioVideoCard({ video, list }: { video: ProfileVideo; list?: boolean }) {
  const thumb = getVideoThumb(video);
  const sourceLabel = getSourceLabel(video.source as never);
  const postedLabel = formatDateLabel(video.createdAt);
  const categoryLabel = video.outputType || "General";

  return (
    <PrefetchOnHoverLink href={getVideoDetailHref(video.publicSlug)} className="group block min-w-0">
      <article
        className={`h-full overflow-hidden rounded-[1.5rem] border border-[#E7E5E4]/60 bg-white/90 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_8px_24px_rgba(17,17,17,0.04)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(17,17,17,0.08)] ${
          list ? "sm:flex" : ""
        }`}
      >
        {/* Thumbnail — forced 16:9 landscape for both grid and list */}
        <div className={`relative overflow-hidden bg-[#F0F0EF] ${list ? "aspect-video w-full shrink-0 sm:w-[220px] lg:w-[320px]" : ""}`}>
          {thumb ? (
            <Image
              src={thumb}
              alt={`Thumbnail ${video.title}`}
              width={405}
              height={228}
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className={`h-full w-full object-cover transition duration-300 group-hover:scale-[1.03] ${list ? "" : "aspect-video"}`}
              loading="lazy"
            />
          ) : (
            <div className={`flex items-center justify-center text-[#C4C4C4] aspect-video`}>
              <Video className="h-7 w-7" />
            </div>
          )}
          {/* Category badge on image */}
          <span className="absolute right-2 top-2 rounded-full bg-[#111111] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] sm:right-3 sm:top-3 sm:px-3 sm:py-1 sm:text-[11px]">
            {categoryLabel}
          </span>
        </div>

        {/* Content */}
        <div className={`min-w-0 p-4 sm:p-5 ${list ? "flex flex-1 flex-col justify-center" : ""}`}>
          {/* Badges row */}
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full border border-[#EBEBEB] bg-[#F7F7F7] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#6B6B6B]">
              {sourceLabel}
            </span>
            <span className="inline-flex items-center rounded-full border border-[#EBEBEB] bg-[#F7F7F7] px-2.5 py-0.5 text-[10.5px] font-semibold text-[#6B6B6B]">
              {video.durationLabel || "—"}
            </span>
          </div>

          {/* Title */}
          <h3 className="line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.01em] text-[#111111] sm:text-base">
            {video.title}
          </h3>

          {/* Description */}
          <p className={`mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-[#6B6B6B] ${list ? "" : "line-clamp-2"}`}>
            {createTextExcerpt(video.description, 120) || "Belum ada deskripsi."}
          </p>

          {/* Footer: date + attribution */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0F0F0] pt-3 text-[11.5px]">
            <span className="inline-flex items-center gap-1 font-medium text-[#9A9A9A]">
              <CalendarDays className="h-3 w-3" />
              {postedLabel}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-[#3B82F6] transition group-hover:gap-1.5">
              Lihat Detail
              <ArrowUpRight className="h-3.5 w-3.5 text-[#3B82F6]" />
            </span>
          </div>
        </div>
      </article>
    </PrefetchOnHoverLink>
  );
});

/**
 * Halaman detail video versi premium berdasarkan design.md.
 * Layout dua kolom dengan media card sebagai fokus utama, deskripsi
 * project, stats meta media, dan sidebar (Project Info, Creator, Share).
 */
export function VideoDetailPublicPage({ video }: { video: PublicVideo }) {
  const username = video.author?.username || "";
  const detailHref = getVideoDetailHref(video.publicSlug);
  const creatorHref = username ? getCreatorBioHref(username) : "/";
  const portfolioHref = username ? getCreatorPortfolioHref(username) : "/videos";
  const sourceLabel = getSourceLabel(video.source as never);
  const hasPrev = Boolean(video.hasPreviousVideo);
  const hasNext = Boolean(video.hasNextVideo);
  const isPortrait = video.aspectRatio === "portrait";
  const ratioLabel = isPortrait ? "9:16" : "16:9";
  const totalMedia =
    1 +
    (Array.isArray(video.extraVideoUrls) ? video.extraVideoUrls.length : 0) +
    (Array.isArray(video.imageUrls) ? video.imageUrls.length : 0);
  const statusLabel =
    video.visibility === "public"
      ? "Public / Selesai"
      : video.visibility === "draft"
        ? "Draft"
        : video.visibility === "private"
          ? "Private"
          : video.visibility === "semi_private"
            ? "Semi Private"
            : "Owner Preview";
  const isPublicStatus = video.visibility === "public";
  const platformIsInstagram = video.source === "instagram";
  const projectTitle = video.title || "Project tanpa judul";
  const safeSourceUrl = getSafeExternalUrl(video.sourceUrl);

  // Glass card dasar — putih semi transparan dengan border lembut.
  const glassCard =
    "min-w-0 max-w-full overflow-hidden border-[#e5edf5] bg-white/92 shadow-[0_16px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm";

  return (
    <div className="relative min-h-screen w-full max-w-full overflow-x-hidden text-[#111827]">
      {/* Soft blue-gray gradient background — selaras dengan halaman bio & portfolio */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background: `
            radial-gradient(ellipse 60% 45% at 12% 10%, rgba(184,228,240,0.45) 0%, transparent 70%),
            radial-gradient(ellipse 55% 40% at 88% 12%, rgba(197,232,244,0.32) 0%, transparent 65%),
            radial-gradient(ellipse 70% 50% at 50% 90%, rgba(208,236,246,0.28) 0%, transparent 65%),
            linear-gradient(180deg, #f7fbff 0%, #f3f7fb 100%)
          `,
        }}
      />

      <main className="relative z-10 mx-auto w-full max-w-[1440px] overflow-x-hidden px-4 pb-12 pt-5 sm:px-6 sm:pb-16 sm:pt-6 lg:overflow-x-visible lg:px-8">
        {/* Navbar atas: logo + share + buka source */}
        <nav
          aria-label="Navigasi halaman detail video"
          className="mb-4 flex min-w-0 max-w-full flex-col gap-3 rounded-[14px] border border-[#e2e8f0]/90 bg-white/86 px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-2.5"
        >
          <Link
            href="/"
            aria-label="Beranda Showreels.id"
            className="inline-flex min-w-0 items-center gap-2.5 self-start sm:self-auto"
          >
            <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] text-base font-bold text-white shadow-[0_8px_18px_rgba(59,130,246,0.35)]">
              S
            </span>
            <span className="min-w-0 truncate text-[0.95rem] font-bold tracking-[-0.02em] text-[#111827]">
              Showreels<span className="text-[#3b82f6]">.id</span>
            </span>
          </Link>
          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {/* Tombol bagikan kecil — pakai PublicShareQrActions agar fitur konsisten */}
            <Link
              href={safeSourceUrl || video.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-xl bg-[#111111] px-5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(17,17,17,0.18)] transition hover:-translate-y-0.5 hover:bg-black sm:w-auto"
            >
              <span className="min-w-0 break-words">Buka Source Asli</span>
              <ArrowUpRight className="h-4 w-4 shrink-0" />
            </Link>
          </div>
        </nav>

        {/* Back button pill */}
        <div className="mb-4 flex min-w-0 max-w-full flex-wrap items-center gap-2 sm:mb-5">
          <Link
            href={portfolioHref}
            className="inline-flex h-11 min-w-0 items-center gap-2 rounded-full border border-[#e6edf5] bg-white/85 px-5 text-sm font-semibold text-[#111827] shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-[#dbe3ec] hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="min-w-0 break-words">Kembali ke Portofolio</span>
          </Link>
          {video.totalCreatorVideos && video.totalCreatorVideos > 2 ? (
            <div className="ml-auto hidden min-w-0 items-center gap-2 sm:flex">
              <Link
                href={hasPrev ? getVideoDetailHref(video.previousSlug || "") : detailHref}
                className={`inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold ${
                  hasPrev
                    ? "border-[#e6edf5] bg-white/85 text-[#111827] backdrop-blur transition hover:-translate-y-0.5 hover:border-[#dbe3ec] hover:shadow-md"
                    : "pointer-events-none border-[#ececec] bg-[#f7f7f7] text-[#a3a3a3]"
                }`}
                aria-disabled={!hasPrev}
                aria-label="Video sebelumnya"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                <span className="min-w-0 break-words">Sebelumnya</span>
              </Link>
              <Link
                href={hasNext ? getVideoDetailHref(video.nextSlug || "") : detailHref}
                className={`inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold ${
                  hasNext
                    ? "border-[#e6edf5] bg-white/85 text-[#111827] backdrop-blur transition hover:-translate-y-0.5 hover:border-[#dbe3ec] hover:shadow-md"
                    : "pointer-events-none border-[#ececec] bg-[#f7f7f7] text-[#a3a3a3]"
                }`}
                aria-disabled={!hasNext}
                aria-label="Video berikutnya"
              >
                <span className="min-w-0 break-words">Berikutnya</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            </div>
          ) : null}
        </div>

        {/* Layout dua kolom desktop, satu kolom mobile */}
        <div className="grid min-w-0 max-w-full gap-5 overflow-x-hidden lg:grid-cols-[minmax(0,2.15fr)_minmax(340px,1fr)] lg:gap-6 lg:overflow-x-visible">
          {/* Kolom utama: media + deskripsi + stats */}
          <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden lg:overflow-x-visible">
            {/* Main media card */}
            <Card
              className={`${glassCard} overflow-hidden rounded-[20px] p-3 sm:rounded-[24px] sm:p-[18px]`}
            >
              <div className="flex min-w-0 max-w-full items-center justify-center overflow-hidden">
                <div
                  className={
                    isPortrait
                      ? "w-full min-w-0 max-w-[440px] overflow-hidden"
                      : "w-full min-w-0 overflow-hidden"
                  }
                >
                  <MediaPreviewCarousel
                    manualThumbnailUrl={video.thumbnailUrl}
                    fallbackThumbnailUrl={
                      video.previewImage || getAutoThumbnailFromVideoUrl(video.sourceUrl)
                    }
                    mainVideoUrl={video.mediaType === "image" ? "" : video.sourceUrl}
                    extraVideoUrls={video.extraVideoUrls}
                    imageUrls={video.imageUrls}
                    title={video.title}
                    showHeading={false}
                    showStatusBadge={Boolean(video.thumbnailUrl)}
                    preferMainVideo={video.mediaType !== "image"}
                    aspectRatio={video.aspectRatio || "landscape"}
                  />
                </div>
              </div>
            </Card>

            {/* Project description card */}
            <Card
              className={`${glassCard} rounded-[18px] p-5 sm:rounded-[22px] sm:p-6 lg:p-7`}
            >
              <p className="text-safe text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#8b98a7]">
                Tentang Project
              </p>
              <h1 className="text-safe mt-2 text-[1.5rem] font-extrabold leading-[1.1] tracking-[-0.04em] text-[#111111] sm:text-[1.875rem] lg:text-[2.125rem]">
                {projectTitle}
              </h1>
              <p className="text-safe mt-2.5 max-w-[720px] whitespace-pre-line text-[14px] leading-[1.7] text-[#4b5563] [overflow-wrap:anywhere] sm:text-[15px]">
                {video.description?.trim() ||
                  "Deskripsi project belum ditambahkan oleh creator."}
              </p>

              {/* Key points — gunakan tags sebagai highlight kalau ada */}
              {video.tags.length > 0 ? (
                <ul className="mt-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
                  {video.tags.slice(0, 4).map((tag) => (
                    <li
                      key={tag}
                      className="grid grid-cols-[20px_1fr] items-start gap-2.5"
                    >
                      <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#3b82f6] text-white">
                        <CheckCircle2 className="h-3 w-3" aria-hidden />
                      </span>
                      <span className="text-safe min-w-0 break-words text-[13.5px] font-semibold leading-[1.5] text-[#111827]">
                        #{tag}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>

            {/* Stats / Media metadata bar */}
            <Card
              className={`${glassCard} rounded-[16px] p-0 sm:rounded-[18px]`}
            >
              <div className="grid min-w-0 max-w-full grid-cols-2 lg:grid-cols-4">
                <StatItem
                  icon={<Layers className="h-4 w-4" aria-hidden />}
                  value={String(totalMedia)}
                  label="Media"
                />
                <StatItem
                  icon={<Clock3 className="h-4 w-4" aria-hidden />}
                  value={video.durationLabel || "-"}
                  label="Durasi"
                  withBorderLeft
                />
                <StatItem
                  icon={<Film className="h-4 w-4" aria-hidden />}
                  value={isPortrait ? "Vertical" : "Horizontal"}
                  label="Orientasi"
                  withBorderTopOnMobile
                />
                <StatItem
                  icon={<Clapperboard className="h-4 w-4" aria-hidden />}
                  value={ratioLabel}
                  label="Rasio"
                  withBorderLeft
                  withBorderTopOnMobile
                />
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <aside className="min-w-0 max-w-full space-y-[18px] overflow-x-hidden lg:sticky lg:top-6 lg:self-start lg:overflow-x-visible">
            {/* Project Info */}
            <Card className={`${glassCard} rounded-[20px] p-5 sm:rounded-[24px]`}>
              <p className="text-safe text-[12px] font-extrabold uppercase tracking-[0.22em] text-[#8b98a7]">
                Project Info
              </p>
              <div className="mt-4 grid min-w-0 gap-2.5">
                <InfoRow label="Output" value={video.outputType || "General"} />
                <InfoRow
                  label="Platform"
                  value={
                    platformIsInstagram ? (
                      <span className="inline-flex items-center gap-2">
                        <span
                          aria-hidden
                          className="inline-block h-5 w-5 rounded-md bg-[linear-gradient(135deg,#f97316,#db2777,#7c3aed)]"
                        />
                        <span className="text-safe min-w-0 break-words">{sourceLabel}</span>
                      </span>
                    ) : (
                      sourceLabel
                    )
                  }
                />
                <InfoRow label="Durasi" value={video.durationLabel || "-"} />
                <InfoRow
                  label="Status"
                  value={
                    <span
                      className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-extrabold ${
                        isPublicStatus
                          ? "bg-[#dcfce7] text-[#15803d]"
                          : "bg-[#fef3c7] text-[#92400e]"
                      }`}
                    >
                      {statusLabel}
                    </span>
                  }
                />
                <InfoRow label="Tanggal" value={formatDateLabel(video.createdAt)} />
              </div>

              {video.tags.length > 0 ? (
                <div className="mt-4 min-w-0">
                  <p className="text-safe mb-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8b98a7]">
                    <Tag className="h-3 w-3" aria-hidden />
                    Tags
                  </p>
                  <div className="flex min-w-0 flex-wrap gap-2">
                    {video.tags.map((tag) => (
                      <PlatformBadge key={tag}>#{tag}</PlatformBadge>
                    ))}
                  </div>
                </div>
              ) : null}
            </Card>

            {/* Creator card */}
            {video.author ? (
              <Card className={`${glassCard} rounded-[20px] p-5 sm:rounded-[24px]`}>
                <p className="text-safe text-[12px] font-extrabold uppercase tracking-[0.22em] text-[#8b98a7]">
                  Creator
                </p>
                <div className="mt-4 flex min-w-0 items-center gap-3.5">
                  <AvatarBadge
                    name={video.author.name || "Creator"}
                    avatarUrl={video.author.image || ""}
                    crop={{
                      x: video.author.avatarCropX,
                      y: video.author.avatarCropY,
                      zoom: video.author.avatarCropZoom,
                    }}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <h2 className="text-safe text-[16px] font-extrabold text-[#111827]">
                      {video.author.name || "Creator"}
                    </h2>
                    <p className="text-safe mt-0.5 text-[13px] text-[#6b7280]">
                      @{video.author.username || "creator"}
                    </p>
                    {video.author.role ? (
                      <p className="text-safe mt-1 text-[13px] text-[#525252]">
                        {video.author.role}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-[18px] grid min-w-0 gap-2.5">
                  <Link
                    href={creatorHref}
                    className="inline-flex h-[46px] min-w-0 items-center justify-center rounded-xl bg-[#111111] px-4 text-center text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(17,17,17,0.18)] transition hover:-translate-y-0.5 hover:bg-black"
                  >
                    <span className="min-w-0 break-words">Lihat Bio</span>
                  </Link>
                  {video.author.showPortfolioButton !== false ? (
                    <Link
                      href={portfolioHref}
                      className="inline-flex h-[46px] min-w-0 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white px-4 text-center text-sm font-extrabold text-[#111827] transition hover:-translate-y-0.5 hover:border-[#dbe3ec] hover:bg-[#f8fafc]"
                    >
                      <span className="min-w-0 break-words">Lihat Semua Portofolio</span>
                    </Link>
                  ) : null}
                </div>
              </Card>
            ) : null}

            {/* Share project card */}
            <Card className={`${glassCard} rounded-[20px] p-5 sm:rounded-[24px]`}>
              <p className="text-safe text-[12px] font-extrabold uppercase tracking-[0.22em] text-[#8b98a7]">
                Bagikan Project
              </p>
              <h2 className="text-safe mt-2 inline-flex items-center gap-2 text-[1.25rem] font-extrabold text-[#111827]">
                <Sparkles className="h-4 w-4 text-[#3b82f6]" aria-hidden />
                Sebarkan ke audiens
              </h2>
              <p className="text-safe mt-1.5 text-[13px] text-[#6b7280]">
                Gunakan tombol di bawah untuk berbagi link project ini ke media sosial atau kontak Anda.
              </p>
              <div className="mt-4 min-w-0 max-w-full overflow-hidden">
                <PublicShareQrActions title={video.title} pathname={detailHref} />
              </div>
            </Card>
          </aside>
        </div>

        {/* Made with badge */}
        {!video.whitelabelEnabled ? (
          <div className="mt-6 flex justify-center sm:mt-8">
            <Link
              href="/"
              className="inline-flex h-[34px] items-center gap-1.5 rounded-full border border-[#e5edf5] bg-white/85 px-[18px] text-[13px] text-[#6b7280] shadow-[0_10px_24px_rgba(15,23,42,0.045)] transition hover:bg-white"
            >
              Made with
              <span className="font-extrabold text-[#2563eb]">Showreels.id</span>
              <span aria-hidden className="text-[#ef4444]">
                ♡
              </span>
            </Link>
          </div>
        ) : null}

        {/* Mobile prev/next bottom bar */}
        {video.totalCreatorVideos && video.totalCreatorVideos > 2 ? (
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#e7e5e4]/70 bg-white/95 p-3 backdrop-blur sm:hidden">
            <div className="mx-auto flex max-w-md min-w-0 items-center justify-between gap-2">
              <Link
                href={hasPrev ? getVideoDetailHref(video.previousSlug || "") : detailHref}
                className={`inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-xl border px-2 text-center text-sm font-semibold ${
                  hasPrev
                    ? "border-[#e7e5e4] bg-white text-[#111111]"
                    : "pointer-events-none border-[#ececec] bg-[#f7f7f7] text-[#a3a3a3]"
                }`}
                aria-disabled={!hasPrev}
              >
                <span className="min-w-0 break-words">Sebelumnya</span>
              </Link>
              <span className="shrink-0 px-2 text-[11px] font-semibold text-[#8a8a8a]">
                {video.page || 1}/{video.totalCreatorVideos}
              </span>
              <Link
                href={hasNext ? getVideoDetailHref(video.nextSlug || "") : detailHref}
                className={`inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-xl border px-2 text-center text-sm font-semibold ${
                  hasNext
                    ? "border-[#e7e5e4] bg-white text-[#111111]"
                    : "pointer-events-none border-[#ececec] bg-[#f7f7f7] text-[#a3a3a3]"
                }`}
                aria-disabled={!hasNext}
              >
                <span className="min-w-0 break-words">Berikutnya</span>
              </Link>
            </div>
          </div>
        ) : null}
      </main>

      {video.whitelabelEnabled ? null : (
        <div className="relative z-10">
          <PublicFooter />
        </div>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[48px] min-w-0 max-w-full flex-wrap items-center justify-between gap-2.5 rounded-[14px] border border-[#edf2f7] bg-white/72 px-4 py-2.5">
      <span className="min-w-0 break-words text-[13px] font-medium text-[#6b7280]">
        {label}
      </span>
      <span className="min-w-0 break-words text-right text-[13px] font-bold text-[#111827] [overflow-wrap:anywhere]">
        {value}
      </span>
    </div>
  );
}

function StatItem({
  icon,
  value,
  label,
  withBorderLeft = false,
  withBorderTopOnMobile = false,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  withBorderLeft?: boolean;
  withBorderTopOnMobile?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-3 px-4 py-4 sm:px-5 ${
        withBorderLeft ? "lg:border-l lg:border-[#edf2f7]" : ""
      } ${withBorderTopOnMobile ? "border-t border-[#edf2f7] lg:border-t-0" : ""}`}
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#eaf2ff] text-[#3b82f6]">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="text-safe block min-w-0 break-words text-[15px] font-extrabold text-[#111827] sm:text-[17px]">
          {value}
        </span>
        <span className="text-safe mt-0.5 block min-w-0 break-words text-[12px] text-[#6b7280]">
          {label}
        </span>
      </span>
    </div>
  );
}
