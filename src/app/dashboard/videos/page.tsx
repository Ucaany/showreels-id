import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Film, Link2, Plus, UploadCloud } from "lucide-react";
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

  const publicReadyCount = myVideos.filter(
    (video) => video.visibility === "public" || video.visibility === "semi_private"
  ).length;
  const draftCount = myVideos.filter((video) => video.visibility === "draft").length;
  const pinnedCount = myVideos.filter((video) => video.pinnedToProfile).length;

  const stats = [
    { label: "Total Video", value: myVideos.length },
    { label: "Public Ready", value: publicReadyCount },
    { label: "Draft", value: draftCount },
    { label: "Pinned", value: pinnedCount },
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <Card className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-0 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="p-5 sm:p-7 lg:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
              <UploadCloud className="h-3.5 w-3.5" />
              Upload Video
            </div>
            <h1 className="mt-5 font-display text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">
              Video Portfolio Creator
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Upload, kelola, dan hubungkan video terbaik ke Build Link dalam tampilan bento yang lebih compact.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link href="/dashboard/videos/new">
                <Button className="w-full bg-zinc-950 text-white hover:bg-black sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Upload Video
                </Button>
              </Link>
              <Link href="/dashboard/link-builder">
                <Button variant="secondary" className="w-full sm:w-auto">
                  <Link2 className="h-4 w-4" />
                  Hubungkan ke Build Link
                </Button>
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8">
            <div className="grid grid-cols-2 gap-3">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-5">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Video Management</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">Daftar video portfolio</h2>
          </div>
          <p className="text-sm text-slate-500">Cari, filter, sort, dan pin maksimal 3 video ke Bio Link.</p>
        </div>

        {myVideos.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <Film className="mx-auto h-9 w-9 text-slate-700" />
            <p className="mt-3 font-semibold text-slate-900">Belum ada video portfolio</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Upload video pertama Anda atau hubungkan video dari Google Drive.
            </p>
            <Link href="/dashboard/videos/new" className="mt-4 inline-block">
              <Button className="bg-zinc-950 text-white hover:bg-black">Upload Video</Button>
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
