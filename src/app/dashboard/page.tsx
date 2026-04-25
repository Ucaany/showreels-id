import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { FolderOpen, Link2, Video } from "lucide-react";
import { CreatorTrafficPanel } from "@/components/dashboard/creator-traffic-panel";
import { DashboardGreetingCard } from "@/components/dashboard/dashboard-greeting-card";
import { ShareProfileActions } from "@/components/dashboard/share-profile-actions";
import { Button } from "@/components/ui/button";
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
    {
      href: "/dashboard/videos",
      title: "Kelola Video",
      description: "Tambah, edit, dan atur visibilitas video portfolio.",
      cta: "Buka Kelola Video",
    },
    {
      href: "/dashboard/profile",
      title: "Edit Profile",
      description: "Perbarui bio, role, serta identitas creator kamu.",
      cta: "Edit Profile",
    },
    {
      href: "/dashboard/analytics",
      title: "Buka Analitik",
      description: "Pantau perkembangan traffic 7 hari dan 30 hari.",
      cta: "Lihat Analitik",
    },
    {
      href: "/dashboard/billing",
      title: "Kelola Subscription",
      description: "Cek plan aktif, transaksi, dan pengelolaan billing.",
      cta: "Buka Billing",
    },
  ] as const;

  const hasNoData = activeLinks.length === 0 && myVideos.length === 0;

  return (
    <div className="space-y-6">
      <DashboardGreetingCard
        locale={locale}
        welcomeLabel={locale === "en" ? "Welcome back," : "Selamat datang kembali,"}
        userName={user.name ?? "Creator"}
      />

      <section className="space-y-3">
        <div>
          <p className="text-sm font-medium text-[#5873a0]">Card 1</p>
          <h2 className="font-display text-2xl font-semibold text-[#1b2e4f]">
            Greetings + Traffic Analisa Video
          </h2>
        </div>
        <CreatorTrafficPanel compact periodMode="dashboard" />
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-sm font-medium text-[#5873a0]">Card 2</p>
          <h2 className="font-display text-2xl font-semibold text-[#1b2e4f]">
            Share Link + Ringkasan Performa Konten
          </h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card className="dashboard-clean-card border-[#d6e2f7] bg-white p-4 sm:p-5">
            <p className="text-sm font-medium text-[#5873a0]">Share link postingan</p>
            <h3 className="mt-1 text-xl font-semibold text-[#1b2e4f] sm:text-2xl">
              Bagikan halaman creator kamu
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#4f658f]">
              Copy link, buka public profile, dan bagikan melalui popup share lengkap
              dengan QR code.
            </p>
            <div className="mt-4">
              <ShareProfileActions username={user.username || "creator"} />
            </div>
          </Card>

          <Card className="dashboard-clean-card border-[#d6e2f7] bg-white p-4 sm:p-5">
            <p className="text-sm font-medium text-[#5873a0]">Ringkasan performa konten</p>
            <h3 className="mt-1 text-xl font-semibold text-[#1b2e4f] sm:text-2xl">
              Insight utama creator
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {metricCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-xl border border-[#d9e5f7] bg-[#fbfdff] p-3.5"
                  >
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
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </section>

      {hasNoData ? (
        <Card className="dashboard-clean-card border-dashed border-[#cfdcf2] bg-[#f6faff] p-5">
          <h3 className="text-xl font-semibold text-[#1b2e4f]">
            Belum ada data performa
          </h3>
          <p className="mt-2 text-sm text-[#4f658f]">
            Mulai bagikan link kamu atau upload video pertama untuk melihat traffic
            dan metrik dashboard.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/dashboard/link-builder">
              <Button>Mulai dari Build Link</Button>
            </Link>
            <Link href="/dashboard/videos/new">
              <Button variant="secondary">Tambah Video Pertama</Button>
            </Link>
          </div>
        </Card>
      ) : null}

      <section className="space-y-3">
        <div>
          <p className="text-sm font-medium text-[#5873a0]">Card 3</p>
          <h2 className="font-display text-2xl font-semibold text-[#1b2e4f]">Quick Action</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {quickActions.map((item) => (
            <Card key={item.href} className="dashboard-clean-card border-[#d6e2f7] bg-white p-4">
              <h3 className="text-base font-semibold text-[#1b2e4f]">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-[#4f658f]">{item.description}</p>
              <Link href={item.href} className="mt-4 inline-block">
                <Button size="sm" variant="secondary">
                  {item.cta}
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
