import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Film, Plus, UploadCloud, Wand2 } from "lucide-react";
import { DashboardVideoList } from "@/components/dashboard/dashboard-video-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db, isDatabaseConfigured } from "@/db";
import { videos } from "@/db/schema";
import { requireCurrentUser } from "@/server/current-user";

export default async function DashboardVideosPage() {
  const user = await requireCurrentUser();

  const myVideos = isDatabaseConfigured
    ? await db.query.videos.findMany({
        where: eq(videos.userId, user.id),
        orderBy: desc(videos.createdAt),
        columns: {
          id: true,
          title: true,
          source: true,
          sourceUrl: true,
          thumbnailUrl: true,
          visibility: true,
          pinnedToProfile: true,
          pinnedOrder: true,
          publicSlug: true,
          createdAt: true,
        },
      })
    : [];

  const publicCount = myVideos.filter(
    (video) => video.visibility === "public" || video.visibility === "semi_private"
  ).length;

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-0 shadow-sm shadow-slate-900/5">
        <div className="grid gap-0 lg:grid-cols-[1fr_0.72fr]">
          <div className="relative overflow-hidden p-5 sm:p-7">
            <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-emerald-100/70 blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">
                <UploadCloud className="h-3.5 w-3.5" />
                Upload Video
              </div>
              <h1 className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                Kelola portfolio video
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Upload, filter, edit status, dan pin maksimal 3 video public atau semi-private ke Bio Link publik.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/dashboard/videos/new">
                  <Button>
                    <Plus className="h-4 w-4" />
                    Upload Video
                  </Button>
                </Link>
                <Link href="/dashboard/link-builder">
                  <Button variant="secondary">
                    <Wand2 className="h-4 w-4" />
                    Buka Build Link
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 bg-[linear-gradient(135deg,#fafafa,#f8fafc)] p-5 sm:p-7 lg:border-l lg:border-t-0">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.35rem] border border-slate-200 bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Total Video</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{myVideos.length}</p>
              </div>
              <div className="rounded-[1.35rem] border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Siap Bio Link</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-emerald-900">{publicCount}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5">
        {myVideos.length === 0 ? (
          <div className="rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <Film className="mx-auto h-9 w-9 text-slate-700" />
            <p className="mt-3 font-semibold text-slate-900">Belum ada video portfolio.</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Tambahkan video pertama untuk mulai membangun portfolio dan block video di halaman creator.
            </p>
            <Link href="/dashboard/videos/new" className="mt-4 inline-block">
              <Button>Upload Video Pertama</Button>
            </Link>
          </div>
        ) : (
          <DashboardVideoList
            videos={myVideos.map((video) => ({
              id: video.id,
              title: video.title,
              source: video.source,
              sourceUrl: video.sourceUrl,
              thumbnailUrl: video.thumbnailUrl,
              visibility: video.visibility,
              pinnedToProfile: video.pinnedToProfile,
              pinnedOrder: video.pinnedOrder,
              publicSlug: video.publicSlug,
              createdAt: video.createdAt.toISOString(),
            }))}
          />
        )}
      </Card>
    </div>
  );
}

