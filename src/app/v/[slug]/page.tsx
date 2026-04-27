import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ExternalLink,
  LayoutTemplate,
  MapPin,
  UserRound,
} from "lucide-react";
import { AvatarBadge } from "@/components/avatar-badge";
import { MediaPreviewCarousel } from "@/components/media-preview-carousel";
import { PublicVideoMeta } from "@/components/public-video-meta";
import { PublicShareCard } from "@/components/public-share-card";
import { SocialLinks } from "@/components/social-links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/server/current-user";
import { getPublicVideo } from "@/server/public-data";
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#edf3ff_0%,#f8fbff_48%,#f2f7ff_100%)]">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="overflow-hidden rounded-[2rem] border-[#cbddfd] bg-[radial-gradient(circle_at_top_left,_rgba(47,115,255,0.15),_transparent_35%),linear-gradient(180deg,_rgba(255,255,255,0.99),_rgba(244,249,255,0.98))] shadow-[0_22px_52px_rgba(29,72,148,0.12)]">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-end gap-3">
                <Link href={video.sourceUrl} target="_blank">
                  <Button variant="secondary" size="sm" className="rounded-[1rem]">
                    <ExternalLink className="h-4 w-4" />
                    Buka sumber video
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                <h1 className="font-display text-3xl font-semibold leading-tight text-[#17305b] sm:text-4xl">
                  {video.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-[#2f73ff] text-white shadow-none">
                    <LayoutTemplate className="mr-1 h-3.5 w-3.5" />
                    {video.aspectRatio === "portrait" ? "Portrait 9:16" : "Landscape 16:9"}
                  </Badge>
                  <Badge className="bg-[#1d3e73] text-white shadow-none">
                    Output: {video.outputType || "General"}
                  </Badge>
                  <Badge className="bg-[#2a518d] text-white shadow-none">
                    Durasi: {video.durationLabel || "-"}
                  </Badge>
                </div>
                <div className="space-y-3 rounded-2xl border border-[#d4e2f8] bg-white/92 p-4">
                  <PublicVideoMeta
                    sourceBadgeClassName={sourceMeta.className}
                    sourceLabel={getSourceLabel(video.source as never)}
                    createdAt={video.createdAt.toISOString()}
                  />
                  <p className="whitespace-pre-line text-sm leading-7 text-[#4f6791] sm:text-base">
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
            <Card className="space-y-4 rounded-[1.7rem] border-[#d4e2f8] bg-white/95 shadow-[0_12px_30px_rgba(36,74,145,0.08)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5873a0]">
                  Creator
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-[#17305b]">
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
                      <p className="font-semibold text-[#17305b]">
                        {video.author.name}
                      </p>
                      <span className="text-sm text-[#5a6f96]">
                        @{video.author.username || "creator"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm text-[#5a6f96]">
                        <MapPin className="h-3.5 w-3.5" />
                        {video.author.city || "Wilayah belum diisi"}
                      </span>
                    </div>
                    {video.author.role ? (
                      <p className="mt-1 text-sm font-medium text-[#2f73ff]">
                        {video.author.role}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-sm leading-7 text-[#4f6791]">{creatorBio}</p>
                </div>
              </div>
              <SocialLinks
                websiteUrl={video.author.websiteUrl}
                balanced
                className="w-full"
                variant="icon-card"
                instagramUrl={video.author.instagramUrl}
                youtubeUrl={video.author.youtubeUrl}
                facebookUrl={video.author.facebookUrl}
                threadsUrl={video.author.threadsUrl}
                linkedinUrl={
                  "linkedinUrl" in video.author ? video.author.linkedinUrl : ""
                }
              />
              {video.author.username ? (
                <div className="space-y-2">
                  <Link href={`/creator/${video.author.username}`}>
                    <Button className="w-full rounded-[1rem]">
                      <UserRound className="h-4 w-4" />
                      Lihat halaman creator
                    </Button>
                  </Link>
                  {isVideoOwner ? (
                    <div className="flex">
                      <Link href="/dashboard" className="w-full">
                        <Button variant="secondary" className="w-full rounded-[1rem]">
                          Kembali ke dashboard
                        </Button>
                      </Link>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </Card>

            <Card className="space-y-4 rounded-[1.7rem] border-[#d4e2f8] bg-white/95 text-center shadow-[0_12px_30px_rgba(36,74,145,0.08)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5873a0]">
                  Share
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-[#17305b]">
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
