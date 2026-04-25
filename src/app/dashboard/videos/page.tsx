import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Film, Plus } from "lucide-react";
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

  return (
    <div className="space-y-5">
      <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e24f3b]">
              Kelola Video
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-[#201b18] sm:text-3xl">
              Video Portofolio Saya
            </h1>
            <p className="mt-2 text-sm text-[#5f524b]">
              Atur status video, edit detail, dan publikasikan karya terbaru kamu.
            </p>
          </div>
          <Link href="/dashboard/videos/new">
            <Button>
              <Plus className="h-4 w-4" />
              Tambah Video
            </Button>
          </Link>
        </div>
      </Card>

      <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
        {myVideos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#d9cec7] bg-[#f6f1ed] p-8 text-center">
            <Film className="mx-auto h-8 w-8 text-[#6a5d56]" />
            <p className="mt-3 font-medium text-[#564a44]">Belum ada video yang dipublikasikan.</p>
            <Link href="/dashboard/videos/new" className="mt-4 inline-block">
              <Button>Submit Video</Button>
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
