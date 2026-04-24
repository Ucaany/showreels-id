import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ExternalLink,
  LayoutTemplate,
  MapPin,
  UserRound,
} from "lucide-react";
import { AvatarBadge } from "@/components/avatar-badge";
import { CustomLinksList } from "@/components/custom-links-list";
import { MediaPreviewCarousel } from "@/components/media-preview-carousel";
import { PublicVideoMeta } from "@/components/public-video-meta";
import { PublicShareCard } from "@/components/public-share-card";
import { SocialLinks } from "@/components/social-links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n";
import { getCurrentUser } from "@/server/current-user";
import { getPublicVideo } from "@/server/public-data";
import { getRequestLocale } from "@/server/request-locale";
import { getAutoThumbnailFromVideoUrl, getSourceLabel } from "@/lib/video-utils";
import { getVideoSourceBadgeMeta } from "@/lib/video-source-badge";

function truncateWords(value: string, limit: number): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= limit) {
    return value.trim();
  }
  return `${words.slice(0, limit).join(" ")}...`;
}

export default async function PublicVideoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
  const { slug } = await params;
  const currentUser = await getCurrentUser();
  const video = await getPublicVideo(slug, currentUser?.id);

  if (!video || !video.author) {
    notFound();
  }

  const creatorBio = truncateWords(
    video.author.bio || "Bio belum ditambahkan.",
    30
  );
  const sourceMeta = getVideoSourceBadgeMeta(video.sourceUrl);
  const isVideoOwner = Boolean(
    currentUser && video.author && currentUser.id === video.author.id
  );

  return (
    <div className="min-h-screen bg-canvas">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="overflow-hidden border-[#ddd3cd] bg-[radial-gradient(circle_at_top_left,_rgba(239,79,63,0.16),_transparent_34%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(250,246,242,0.98))]">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Link href={video.sourceUrl} target="_blank">
                  <Button variant="secondary" size="sm">
                    <ExternalLink className="h-4 w-4" />
                    Buka sumber video
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                <h1 className="font-display text-3xl font-semibold leading-tight text-[#201b18] sm:text-4xl">
                  {video.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-[#e24f3b] text-white shadow-none">
                    <LayoutTemplate className="mr-1 h-3.5 w-3.5" />
                    {video.aspectRatio === "portrait" ? "Portrait 9:16" : "Landscape 16:9"}
                  </Badge>
                  <Badge className="bg-[#1f1a17] text-white shadow-none">
                    Output: {video.outputType || "General"}
                  </Badge>
                  <Badge className="bg-[#2d2521] text-white shadow-none">
                    Durasi: {video.durationLabel || "-"}
                  </Badge>
                </div>
                <div className="space-y-3 rounded-2xl border border-[#ddd3cd] bg-white/84 p-4">
                  <PublicVideoMeta
                    sourceBadgeClassName={sourceMeta.className}
                    sourceLabel={getSourceLabel(video.source as never)}
                    createdAt={video.createdAt.toISOString()}
                  />
                  <p className="whitespace-pre-line text-sm leading-7 text-[#5f524b] sm:text-base">
                    {video.description}
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <MediaPreviewCarousel
                  manualThumbnailUrl={video.thumbnailUrl}
                  fallbackThumbnailUrl={getAutoThumbnailFromVideoUrl(video.sourceUrl)}
                  mainVideoUrl={video.sourceUrl}
                  extraVideoUrls={video.extraVideoUrls}
                  imageUrls={video.imageUrls}
                  title={video.title}
                  showHeading={false}
                  showStatusBadge={Boolean(video.thumbnailUrl)}
                  preferMainVideo
                  aspectRatio={video.aspectRatio}
                />
              </div>
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="space-y-4 border-[#ddd3cd] bg-white/92">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7d6f67]">
                  Creator
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-[#201b18]">
                  Tentang Author
                </h2>
              </div>
              <div className="flex items-start gap-3">
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
                <div className="min-w-0 space-y-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[#201b18]">
                        {video.author.name}
                      </p>
                      <span className="text-sm text-[#7d6f67]">
                        @{video.author.username || "creator"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm text-[#7d6f67]">
                        <MapPin className="h-3.5 w-3.5" />
                        {video.author.city || "Wilayah belum diisi"}
                      </span>
                    </div>
                    {video.author.role ? (
                      <p className="mt-1 text-sm font-medium text-[#e24f3b]">
                        {video.author.role}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-sm leading-7 text-[#5f524b]">{creatorBio}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7d6f67]">
                  {dictionary.publicVideoLinksTitle}
                </p>
                <CustomLinksList
                  links={video.author.customLinks}
                  compact
                  maxItems={3}
                  emptyLabel={dictionary.profileCustomLinksEmpty}
                />
              </div>
              <SocialLinks
                websiteUrl={video.author.websiteUrl}
                balanced
                className="w-full"
                instagramUrl={video.author.instagramUrl}
                youtubeUrl={video.author.youtubeUrl}
                facebookUrl={video.author.facebookUrl}
                threadsUrl={video.author.threadsUrl}
              />
              {video.author.username ? (
                <div className="space-y-2">
                  <Link href={`/creator/${video.author.username}`}>
                    <Button className="w-full">
                      <UserRound className="h-4 w-4" />
                      {dictionary.publicVideoLinksCta}
                    </Button>
                  </Link>
                  {isVideoOwner ? (
                    <div className="flex">
                      <Link href="/dashboard" className="w-full">
                        <Button variant="secondary" className="w-full">
                          Kembali ke dashboard
                        </Button>
                      </Link>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </Card>

            <Card className="space-y-4 border-[#ddd3cd] bg-white/92 text-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7d6f67]">
                  Share
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-[#201b18]">
                  Bagikan Link
                </h2>
              </div>
              <PublicShareCard title={video.title} pathname={`/v/${video.publicSlug}`} />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
