import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Eye, FileText, FolderOpen, LockKeyhole } from "lucide-react";
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
  const draftVideosCount = myVideos.filter(
    (video) => video.visibility === "draft"
  ).length;
  const privateVideosCount = myVideos.filter(
    (video) => video.visibility === "private"
  ).length;
  const hour = new Date().getHours();
  const greeting =
    hour < 11
      ? "Selamat pagi"
      : hour < 16
        ? "Selamat siang"
        : hour < 19
          ? "Selamat sore"
          : "Selamat malam";
  const greetingEmoji =
    hour < 11
      ? "\u2600\uFE0F"
      : hour < 16
        ? "\uD83C\uDF24\uFE0F"
        : hour < 19
          ? "\uD83C\uDF07"
          : "\uD83C\uDF19";
  const stats = [
    {
      label: "Publik",
      value: publicVideosCount,
      icon: Eye,
      className: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Draft",
      value: draftVideosCount,
      icon: FileText,
      className: "bg-amber-50 text-amber-700",
    },
    {
      label: "Private",
      value: privateVideosCount,
      icon: LockKeyhole,
      className: "bg-slate-100 text-slate-700",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="dashboard-clean-card overflow-hidden border-border bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.13),_transparent_32%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.96))]">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-600">
              {dictionary.welcomeBack}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
              {greeting}, {user.name ?? "Creator"}{" "}
              <span aria-hidden="true">{greetingEmoji}</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-700 sm:text-base">
              Kelola karya, pantau status video, dan rapikan portofolio dari
              satu ruang kerja yang lebih fokus.
            </p>
          </div>
        </Card>

        <Card className="dashboard-clean-card border-border bg-surface">
          <div>
            <p className="text-sm font-medium text-slate-600">Status video</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-slate-950">
              Pantau visibilitas karya
            </h2>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
            {stats.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.className}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="truncate text-sm font-semibold text-slate-700">
                      {item.label}
                    </span>
                  </div>
                  <p className="font-display text-xl font-semibold text-slate-950">
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <section>
        <Card className="dashboard-clean-card border-border bg-surface">
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold text-slate-900">
              {dictionary.myVideos}
            </h2>
            <p className="text-sm text-slate-600">
              Kelola video public, private, dan draft dari satu tempat.
            </p>
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
                sourceUrl: video.sourceUrl,
                thumbnailUrl: video.thumbnailUrl,
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
