import Link from "next/link";
import { notFound } from "next/navigation";
import { AppLogo } from "@/components/app-logo";
import { AvatarBadge } from "@/components/avatar-badge";
import { PublicShareCard } from "@/components/public-share-card";
import { SitePreferences } from "@/components/site-preferences";
import { VideoEmbed } from "@/components/video-embed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateLabel } from "@/lib/helpers";
import { getPublicVideo } from "@/server/public-data";
import { getSourceLabel } from "@/lib/video-utils";

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
      <header className="border-b border-border bg-surface backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <AppLogo />
          <div className="flex flex-wrap items-center gap-3">
            <SitePreferences />
            <Link href="/auth/login">
              <Button variant="secondary">Masuk Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px]">
        <Card className="space-y-5 border-border bg-surface">
          <div className="space-y-2">
            <Badge>{getSourceLabel(video.source as never)}</Badge>
            <h1 className="font-display text-3xl font-semibold text-slate-900">
              {video.title}
            </h1>
            <p className="text-sm text-slate-600">
              Dipublikasikan pada {formatDateLabel(video.createdAt.toISOString())}
            </p>
          </div>

          <VideoEmbed sourceUrl={video.sourceUrl} source={video.source as never} title={video.title} />

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Deskripsi
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {video.description}
            </p>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="space-y-3 border-border bg-surface">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Tentang Author
            </h2>
            <div className="flex items-center gap-3">
              <AvatarBadge
                name={video.author.name || "Creator"}
                avatarUrl={video.author.image || ""}
                size="lg"
              />
              <div>
                <p className="font-semibold text-slate-900">
                  {video.author.name}
                </p>
                <p className="text-sm text-slate-600">
                  @{video.author.username || "creator"}
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              {video.author.bio || "Bio belum ditambahkan."}
            </p>
            {video.author.username ? (
              <Link href={`/creator/${video.author.username}`}>
                <Button className="w-full" variant="ghost">
                  Lihat semua video creator
                </Button>
              </Link>
            ) : null}
          </Card>

          <Card className="space-y-3 border-border bg-surface">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Bagikan Link
            </h2>
            <PublicShareCard title={video.title} pathname={`/v/${video.publicSlug}`} />
          </Card>
        </div>
      </main>
    </div>
  );
}
