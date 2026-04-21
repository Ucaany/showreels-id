import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { FolderOpen, LayoutDashboard, Video } from "lucide-react";
import { CopyProfileLinkButton } from "@/components/dashboard/copy-profile-link-button";
import { DashboardVideoList } from "@/components/dashboard/dashboard-video-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { getDictionary } from "@/lib/i18n";
import { requireCurrentUser } from "@/server/current-user";
import { getRequestLocale } from "@/server/request-locale";

export default async function DashboardPage() {
  const locale = await getRequestLocale();
  const dictionary = getDictionary(locale);
  const user = await requireCurrentUser();
  const myVideos = await db.query.videos.findMany({
    where: eq(videos.userId, user.id),
    orderBy: desc(videos.createdAt),
  });
  const publicVideosCount = myVideos.filter(
    (video) => video.visibility === "public"
  ).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_32%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))] md:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-600">{dictionary.welcomeBack}</p>
              <h1 className="mt-1 font-display text-2xl font-semibold text-slate-900">
                {user.name ?? "Creator"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-700">
                Satu dashboard untuk mengatur profil creator, status video, dan
                link publik yang siap dibagikan ke client.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
              <p className="font-semibold text-slate-900">Status profil</p>
              <p className="mt-1 text-slate-600">
                {user.username
                  ? `Publik aktif di @${user.username}`
                  : "Lengkapi username untuk mengaktifkan profil publik."}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/dashboard/videos/new">
              <Button>
                <Video className="h-4 w-4" />
                {dictionary.submitVideo}
              </Button>
            </Link>
            <Link href="/dashboard/profile">
              <Button variant="secondary">{dictionary.editProfile}</Button>
            </Link>
            {user.username ? (
              <>
                <Link href={`/creator/${user.username}`}>
                  <Button variant="ghost">{dictionary.publicProfile}</Button>
                </Link>
                <CopyProfileLinkButton username={user.username} />
              </>
            ) : null}
          </div>
        </Card>

        <Card className="border-border bg-surface">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total video</p>
              <p className="font-display text-3xl font-semibold text-slate-900">
                {myVideos.length}
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Publik aktif
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {publicVideosCount}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Draft + private
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {myVideos.length - publicVideosCount}
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <Card className="border-border bg-surface">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900">
                {dictionary.myVideos}
              </h2>
              <p className="text-sm text-slate-600">
                Kelola video public, private, dan draft dari satu tempat.
              </p>
            </div>
            <Link href="/dashboard/videos/new">
              <Button variant="secondary" size="sm">
                {dictionary.submitVideo}
              </Button>
            </Link>
          </div>

          {myVideos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-100 p-8 text-center">
              <FolderOpen className="mx-auto h-8 w-8 text-slate-600" />
              <p className="mt-3 font-medium text-slate-700">
                {dictionary.noVideosYet}
              </p>
              <Link href="/dashboard/videos/new" className="mt-4 inline-block">
                <Button>{dictionary.submitVideo}</Button>
              </Link>
            </div>
          ) : (
            <DashboardVideoList
              videos={myVideos.map((video) => ({
                id: video.id,
                title: video.title,
                source: video.source,
                visibility: video.visibility,
                publicSlug: video.publicSlug,
                createdAt: video.createdAt.toISOString(),
              }))}
            />
          )}
        </Card>
      </section>
    </div>
  );
}
