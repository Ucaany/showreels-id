import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ExternalLink, MapPin, UserRound } from "lucide-react";
import { AvatarBadge } from "@/components/avatar-badge";
import { MediaPreviewCarousel } from "@/components/media-preview-carousel";
import { PublicShareCard } from "@/components/public-share-card";
import { SocialLinks } from "@/components/social-links";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateLabel } from "@/lib/helpers";
import { getPublicVideo } from "@/server/public-data";
import { getAutoThumbnailFromVideoUrl, getSourceLabel } from "@/lib/video-utils";

export default async function PublicVideoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const video = await getPublicVideo(slug);

  if (!video || !video.author) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-canvas">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="overflow-hidden border-border bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{getSourceLabel(video.source as never)}</Badge>
                  <Badge className="bg-slate-100 text-slate-700 shadow-none">
                    <CalendarDays className="mr-1 h-3.5 w-3.5" />
                    {formatDateLabel(video.createdAt.toISOString())}
                  </Badge>
                </div>
                <Link href={video.sourceUrl} target="_blank">
                  <Button variant="secondary" size="sm">
                    <ExternalLink className="h-4 w-4" />
                    Buka sumber video
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                <h1 className="font-display text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
                  {video.title}
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                  {video.description}
                </p>
              </div>

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
              />
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="space-y-4 border-border bg-surface">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Creator
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">
                  Tentang Author
                </h2>
              </div>
              <div className="flex items-start gap-3">
                <AvatarBadge
                  name={video.author.name || "Creator"}
                  avatarUrl={video.author.image || ""}
                  size="lg"
                />
                <div className="space-y-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">
                        {video.author.name}
                      </p>
                      <span className="text-sm text-slate-500">
                        @{video.author.username || "creator"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {video.author.city || "Wilayah belum diisi"}
                      </span>
                    </div>
                    {video.author.role ? (
                      <p className="mt-1 text-sm font-medium text-brand-700">
                        {video.author.role}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-sm leading-7 text-slate-600">
                    {video.author.bio || "Bio belum ditambahkan."}
                  </p>
                </div>
              </div>
              <SocialLinks
                instagramUrl={video.author.instagramUrl}
                youtubeUrl={video.author.youtubeUrl}
                facebookUrl={video.author.facebookUrl}
                threadsUrl={video.author.threadsUrl}
              />
              {video.author.username ? (
                <Link href={`/creator/${video.author.username}`}>
                  <Button className="w-full">
                    <UserRound className="h-4 w-4" />
                    Lihat semua video creator
                  </Button>
                </Link>
              ) : null}
            </Card>

            <Card className="space-y-4 border-border bg-surface">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Share
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">
                  Bagikan Link
                </h2>
              </div>
              <PublicShareCard
                title={video.title}
                pathname={`/v/${video.publicSlug}`}
              />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
