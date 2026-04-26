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
      <Card className="dashboard-clean-card overflow-hidden border-[#cfddf5] bg-white p-0">
        <div className="grid gap-0 lg:grid-cols-[1fr_0.78fr]">
          <div className="p-5 sm:p-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#cfe0ff] bg-[#edf4ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#2f73ff]">
              <UploadCloud className="h-3.5 w-3.5" />
              Upload Video
            </div>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em] text-[#142033] sm:text-4xl">
              Video portfolio creator
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#55709d] sm:text-base">
              Upload, edit, dan atur status video. Video public dapat dipakai sebagai source portfolio di Build Link.
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
                  Hubungkan ke Build Link
                </Button>
              </Link>
            </div>
          </div>
          <div className="border-t border-[#dbe7f8] bg-[radial-gradient(circle_at_top_right,#dceaff,transparent_36%),linear-gradient(180deg,#f8fbff,#edf4ff)] p-5 sm:p-7 lg:border-l lg:border-t-0">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.35rem] border border-[#cfe0ff] bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6078a2]">Total Video</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#142033]">{myVideos.length}</p>
              </div>
              <div className="rounded-[1.35rem] border border-[#cfe0ff] bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6078a2]">Public Ready</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#142033]">{publicCount}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="dashboard-clean-card border-[#cfddf5] bg-white p-4 sm:p-5">
        {myVideos.length === 0 ? (
          <div className="rounded-[1.4rem] border border-dashed border-[#cfe0ff] bg-[#f8fbff] p-8 text-center">
            <Film className="mx-auto h-9 w-9 text-[#2f73ff]" />
            <p className="mt-3 font-semibold text-[#142033]">Belum ada video portfolio.</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-[#6078a2]">
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
              publicSlug: video.publicSlug,
              createdAt: video.createdAt.toISOString(),
            }))}
          />
        )}
      </Card>
    </div>
  );
}
