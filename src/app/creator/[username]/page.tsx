import Link from "next/link";
import { notFound } from "next/navigation";
import { AppLogo } from "@/components/app-logo";
import { AvatarBadge } from "@/components/avatar-badge";
import { SitePreferences } from "@/components/site-preferences";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateLabel } from "@/lib/helpers";
import { getPublicProfile } from "@/server/public-data";
import { getSourceLabel } from "@/lib/video-utils";

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getPublicProfile(username);

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border bg-surface backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <AppLogo />
          <div className="flex flex-wrap items-center gap-3">
            <SitePreferences />
            <Link href="/auth/signup">
              <Button>Buat Profilmu</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit space-y-4 border-border bg-surface">
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
            </div>
          </div>
          <p className="text-sm leading-relaxed text-slate-600">
            {profile.user.bio || "Bio belum ditambahkan."}
          </p>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Experience
            </p>
            <p className="text-sm text-slate-600">
              {profile.user.experience || "Belum ada pengalaman yang ditambahkan."}
            </p>
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
            <div className="space-y-3">
              {profile.videos.map((video) => (
                <Link key={video.id} href={`/v/${video.publicSlug}`}>
                  <div className="rounded-2xl border border-border bg-white/70 p-4 transition hover:-translate-y-0.5 hover:shadow-soft">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-slate-900">
                            {video.title}
                          </h2>
                          <Badge>{getSourceLabel(video.source as never)}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          {video.description}
                        </p>
                      </div>
                      <p className="text-xs text-slate-600">
                        {formatDateLabel(video.createdAt.toISOString())}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
