import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Activity, FolderOpen, Link2, Sparkles, UserRound, Video } from "lucide-react";
import { CreatorTrafficPanel } from "@/components/dashboard/creator-traffic-panel";
import { DashboardGreetingCard } from "@/components/dashboard/dashboard-greeting-card";
import { ShareProfileActions } from "@/components/dashboard/share-profile-actions";
import { Card } from "@/components/ui/card";
import { db, isDatabaseConfigured } from "@/db";
import { videos } from "@/db/schema";
import { normalizeCustomLinks } from "@/lib/profile-utils";
import { requireCurrentUser } from "@/server/current-user";
import { getRequestLocale } from "@/server/request-locale";

export default async function DashboardPage() {
  const locale = await getRequestLocale();
  const user = await requireCurrentUser();

  const myVideos = isDatabaseConfigured
    ? await db.query.videos.findMany({
        where: eq(videos.userId, user.id),
        orderBy: desc(videos.createdAt),
        columns: {
          id: true,
          visibility: true,
        },
      })
    : [];

  const normalizedLinks = normalizeCustomLinks(user.customLinks);
  const activeLinks = normalizedLinks.filter((link) => link.enabled !== false);
  const publicVideosCount = myVideos.filter((video) => video.visibility === "public").length;

  const metricCards = [
    {
      label: "Total Link",
      value: String(activeLinks.length),
      icon: Link2,
      helper: "Link aktif pada halaman publik",
      tone: "bg-[#e9f2ff] text-[#2f73ff]",
    },
    {
      label: "Total Video",
      value: String(myVideos.length),
      icon: Video,
      helper: "Jumlah seluruh video creator",
      tone: "bg-[#edf4ff] text-[#225fe0]",
    },
    {
      label: "Video Publik",
      value: String(publicVideosCount),
      icon: FolderOpen,
      helper: "Video yang bisa dilihat client",
      tone: "bg-[#f1f7ff] text-[#1f58e3]",
    },
  ] as const;

  const quickActions = [
    { href: "/dashboard/videos", title: "Kelola Video", icon: Video },
    { href: "/dashboard/profile", title: "Edit Profile", icon: UserRound },
    { href: "/dashboard/analytics", title: "Analitik", icon: Activity },
    { href: "/dashboard/billing", title: "Billing", icon: Sparkles },
  ] as const;

  return (
    <div className="dashboard-stack">
      <DashboardGreetingCard
        locale={locale}
        welcomeLabel={locale === "en" ? "Welcome back," : "Selamat datang kembali,"}
        userName={user.name ?? "Creator"}
        publicProfileHref={`/creator/${user.username || "creator"}`}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={`kpi-${item.label}`} className="dashboard-kpi-card p-3.5 sm:p-4">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${item.tone}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p className="text-xs font-semibold text-[#5b7198]">{item.label}</p>
              </div>
              <p className="mt-2 text-2xl font-semibold text-[#1b2e4f]">{item.value}</p>
              <p className="mt-1 text-xs text-[#5b7198]">{item.helper}</p>
            </Card>
          );
        })}
      </section>

      <section className="space-y-3">
        <CreatorTrafficPanel compact periodMode="dashboard" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card className="dashboard-panel p-4 sm:p-5">
            <p className="text-sm font-medium text-[#5873a0]">Share link postingan</p>
            <h3 className="mt-1 text-xl font-semibold text-[#1b2e4f] sm:text-2xl">
              Bagikan halaman creator kamu
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#4f658f]">
              Akses cepat untuk share profile, setup link, dan mulai upload konten pertama.
            </p>
            <div className="mt-4">
              <ShareProfileActions
                username={user.username || "creator"}
                includeSetupActions
                iconOnlyOnMobile
              />
            </div>
          </Card>

          <Card className="dashboard-panel p-4 sm:p-5">
            <p className="text-sm font-medium text-[#5873a0]">Ringkasan performa konten</p>
            <h3 className="mt-1 text-xl font-semibold text-[#1b2e4f] sm:text-2xl">
              Snapshot konten creator
            </h3>
            <div className="mt-4 space-y-2.5">
              {metricCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={`snapshot-${item.label}`}
                    className="rounded-xl border border-[#d8e4f7] bg-[#fbfdff] px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${item.tone}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <p className="text-xs font-semibold text-[#5b7198]">{item.label}</p>
                      </div>
                      <p className="text-lg font-semibold text-[#1b2e4f]">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <Card className="dashboard-panel p-4 sm:p-5">
          <div className="dashboard-section-head">
            <h2 className="font-display text-xl font-semibold text-[#1b2e4f]">Quick Action</h2>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((item) => {
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href} className="block">
                  <Card className="dashboard-clean-card border-[#d6e2f7] bg-white p-3 transition hover:border-[#bfd4f5] sm:p-3.5">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef4ff] text-[#2f73ff]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="mt-2 text-sm font-semibold text-[#1b2e4f]">{item.title}</h3>
                  </Card>
                </Link>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
}
