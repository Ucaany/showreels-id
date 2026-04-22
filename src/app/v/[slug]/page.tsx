import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  Clock3,
  ExternalLink,
  LayoutTemplate,
  MapPin,
  UserRound,
} from "lucide-react";
import { AvatarBadge } from "@/components/avatar-badge";
import { MediaPreviewCarousel } from "@/components/media-preview-carousel";
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
  const video = await getPublicVideo(slug);
  const currentUser = await getCurrentUser();

  if (!video || !video.author) {
    notFound();
  }

  const postedDateLabel = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(video.createdAt);
  const postedTimeLabel = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(video.createdAt);
  const creatorBio = truncateWords(
    video.author.bio || "Bio belum ditambahkan.",
    30
  );
  const sourceMeta = getVideoSourceBadgeMeta(video.sourceUrl);

  return (
    <div className="min-h-screen bg-canvas">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="overflow-hidden border-border bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.11),_transparent_32%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))]">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={`${sourceMeta.className} shadow-none`}>
                    {getSourceLabel(video.source as never)}
                  </Badge>
                  <Badge className="bg-slate-900 text-white shadow-none">
                    <CalendarDays className="mr-1 h-3.5 w-3.5" />
                    {postedDateLabel}
                  </Badge>
                  <Badge className="bg-slate-800 text-white shadow-none">
                    <Clock3 className="mr-1 h-3.5 w-3.5" />
                    {postedTimeLabel}
                  </Badge>
                </div>
                <Link href={video.sourceUrl} target="_blank">
                  <Button variant="secondary" size="sm">
                    <ExternalLink className="h-4 w-4" />
                    Buka sumber video
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-brand-700 text-white shadow-none">
                  <LayoutTemplate className="mr-1 h-3.5 w-3.5" />
                  {video.aspectRatio === "portrait" ? "Portrait 9:16" : "Landscape 16:9"}
                </Badge>
                <Badge className="bg-slate-900 text-white shadow-none">
                  Output: {video.outputType || "General"}
                </Badge>
                <Badge className="bg-slate-800 text-white shadow-none">
                  Durasi: {video.durationLabel || "-"}
                </Badge>
              </div>

              <div className="space-y-3">
                <h1 className="font-display text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
                  {video.title}
                </h1>
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-700 sm:text-base">
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
                <div className="min-w-0 space-y-2">
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
                  <p className="text-sm leading-7 text-slate-600">{creatorBio}</p>
                </div>
              </div>
              <SocialLinks
                className="justify-center"
                instagramUrl={video.author.instagramUrl}
                youtubeUrl={video.author.youtubeUrl}
                facebookUrl={video.author.facebookUrl}
                threadsUrl={video.author.threadsUrl}
              />
              {video.author.username ? (
                <div className="space-y-2">
                  <Link href={`/creator/${video.author.username}`}>
                    <Button className="w-full border border-brand-700 bg-brand-600 text-white shadow-soft hover:bg-brand-700">
                      <UserRound className="h-4 w-4" />
                      Lihat semua video creator
                    </Button>
                  </Link>
                  {!currentUser ? (
                    <div className="flex justify-center">
                      <Link href="/dashboard">
                        <Button variant="secondary" size="sm">
                          Kembali Ke Dashboard
                        </Button>
                      </Link>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </Card>

            <Card className="space-y-4 border-border bg-surface text-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Share
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">
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
