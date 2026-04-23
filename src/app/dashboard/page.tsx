import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Eye, FileText, FolderOpen, Link2, LockKeyhole } from "lucide-react";
import { WhatsappSharingCard } from "@/components/auth/whatsapp-sharing-card";
import { CopyProfileLinkButton } from "@/components/dashboard/copy-profile-link-button";
import { DashboardGreetingCard } from "@/components/dashboard/dashboard-greeting-card";
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
  const semiPrivateVideosCount = myVideos.filter(
    (video) => video.visibility === "semi_private"
  ).length;
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
      label: "Semi Private",
      value: semiPrivateVideosCount,
      icon: Link2,
      className: "bg-blue-50 text-blue-700",
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
        <DashboardGreetingCard
          locale={locale}
          welcomeLabel={dictionary.welcomeBack}
          userName={user.name ?? "Creator"}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
            <div>
              <p className="text-sm font-medium text-slate-600">Status video</p>
              <h2 className="mt-1 font-display text-xl font-semibold text-slate-950 sm:text-2xl">
                Pantau visibilitas karya
              </h2>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {stats.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-xl bg-slate-50 px-2 py-3 text-center sm:rounded-2xl sm:px-3"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.className} sm:h-8 sm:w-8`}
                      >
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <span className="truncate text-xs font-semibold text-slate-700 sm:text-sm">
                        {item.label}
                      </span>
                    </div>
                    <p className="mt-1 font-display text-xl font-semibold text-slate-950 sm:text-2xl">
                      {item.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-600">Aksi profile</p>
              <h2 className="font-display text-xl font-semibold text-slate-950 sm:text-2xl">
                Link dan komunitas creator
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Cek halaman profil publikmu dengan cepat dan buka komunitas sharing tanpa pindah menu.
              </p>
            </div>
            <div className="mt-4 grid gap-3">
              <Link href={`/creator/${user.username || "creator"}`} target="_blank">
                <Button className="w-full">Cek Profile Link</Button>
              </Link>
              <CopyProfileLinkButton username={user.username || "creator"} />
            </div>
            <div className="mt-4">
              <WhatsappSharingCard compact />
            </div>
          </Card>
        </div>
      </section>

      <section>
        <Card className="dashboard-clean-card border-border bg-surface">
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold text-slate-900">
              {dictionary.myVideos}
            </h2>
            <p className="text-sm text-slate-600">
              Kelola video public, semi-private, private, dan draft dari satu tempat.
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
