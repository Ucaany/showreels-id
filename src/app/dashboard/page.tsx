import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { FolderOpen, Video } from "lucide-react";
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
        <Card className="border-border bg-surface md:col-span-2">
          <p className="text-sm text-slate-600">
            {dictionary.welcomeBack}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-slate-900">
            {user.name ?? "Creator"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            Dashboard ini menampilkan ringkasan profil dan video portofolio yang
            sudah kamu submit.
          </p>
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
              <Link href={`/creator/${user.username}`}>
                <Button variant="ghost">{dictionary.publicProfile}</Button>
              </Link>
            ) : null}
          </div>
        </Card>

        <Card className="border-border bg-surface">
          <p className="text-sm text-slate-600">Total video</p>
          <p className="mt-2 font-display text-3xl font-semibold text-slate-900">
            {myVideos.length}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Link publik aktif:{" "}
            <span className="font-semibold text-slate-700">
              {publicVideosCount}
            </span>
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Draft + private: {myVideos.length - publicVideosCount}
          </p>
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
