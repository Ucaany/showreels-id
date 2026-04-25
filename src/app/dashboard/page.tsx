import Link from "next/link";
import { and, count, desc, eq, sql } from "drizzle-orm";
import {
  BarChart3,
  Coins,
  Eye,
  FolderOpen,
  Link2,
  Plus,
  UserRoundPen,
} from "lucide-react";
import { CopyProfileLinkButton } from "@/components/dashboard/copy-profile-link-button";
import { DashboardGreetingCard } from "@/components/dashboard/dashboard-greeting-card";
import { DashboardLivePreviewCard } from "@/components/dashboard/dashboard-live-preview-card";
import { DashboardVideoList } from "@/components/dashboard/dashboard-video-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db, isDatabaseConfigured } from "@/db";
import { visitorEvents, videos } from "@/db/schema";
import { normalizeCustomLinks } from "@/lib/profile-utils";
import { requireCurrentUser } from "@/server/current-user";
import { getRequestLocale } from "@/server/request-locale";

function toIdr(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function DashboardPage() {
  const locale = await getRequestLocale();
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

  const publicVideosCount = myVideos.filter((video) => video.visibility === "public").length;
  const normalizedLinks = normalizeCustomLinks(user.customLinks);
  const activeLinks = normalizedLinks.filter((link) => link.enabled !== false);

  let totalViews = 0;
  let totalClicks = 0;

  if (isDatabaseConfigured) {
    const creatorPath = `/creator/${user.username || "creator"}`;
    const [viewsResult] = await db
      .select({ value: count() })
      .from(visitorEvents)
      .where(sql`${visitorEvents.path} LIKE ${`${creatorPath}%`}`);

    const [clicksResult] = await db
      .select({ value: count() })
      .from(visitorEvents)
      .where(and(eq(visitorEvents.path, creatorPath)));

    totalViews = viewsResult?.value ?? 0;
    totalClicks = clicksResult?.value ?? 0;
  }

  const ctr = totalViews > 0 ? Number(((totalClicks / totalViews) * 100).toFixed(2)) : 0;

  const metricCards = [
    {
      label: "Total Views",
      value: String(totalViews),
      icon: Eye,
      helper: "Pengunjung halaman publik",
      className: "bg-[#ecf4ff] text-[#245fbe]",
    },
    {
      label: "Total Links",
      value: String(activeLinks.length),
      icon: Link2,
      helper: "Link aktif yang tampil",
      className: "bg-[#edf8ef] text-[#2d8555]",
    },
    {
      label: "Produk",
      value: String(publicVideosCount),
      icon: FolderOpen,
      helper: "Video publik aktif",
      className: "bg-[#fff3ea] text-[#c0672f]",
    },
    {
      label: "Revenue",
      value: toIdr(0),
      icon: Coins,
      helper: "Segera hadir",
      className: "bg-[#f6f0ff] text-[#6d4aad]",
    },
    {
      label: "Total Clicks",
      value: String(totalClicks),
      icon: BarChart3,
      helper: `CTR ${ctr}%`,
      className: "bg-[#f3f2f7] text-[#4d5065]",
    },
  ];

  const quickActions = [
    {
      href: "/dashboard/link-builder",
      title: "Buka Link Builder",
      description: "Tambah dan atur link bio kamu.",
      cta: "Kelola Link",
    },
    {
      href: "/dashboard/profile",
      title: "Edit Profile",
      description: "Perbarui identitas visual creator.",
      cta: "Edit Profil",
    },
    {
      href: "/dashboard/videos/new",
      title: "Tambah Video",
      description: "Masukkan video karya terbaru.",
      cta: "Tambah Video",
    },
    {
      href: "/dashboard/billing",
      title: "Kelola Billing",
      description: "Lihat plan aktif dan invoice.",
      cta: "Buka Billing",
    },
  ];

  const hasNoData = totalViews === 0 && activeLinks.length === 0 && publicVideosCount === 0;

  return (
    <div className="space-y-6">
      <DashboardGreetingCard
        locale={locale}
        welcomeLabel={locale === "en" ? "Welcome back," : "Selamat datang kembali,"}
        userName={user.name ?? "Creator"}
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
          <p className="text-sm font-medium text-[#655952]">Public Profile Link</p>
          <h2 className="mt-1 font-display text-xl font-semibold text-[#201b18] sm:text-2xl">
            Bagikan halaman creator kamu
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#5f524b]">
            Satu link untuk menampilkan bio, sosial media, dan portofolio kamu ke klien.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/creator/${user.username || "creator"}`} target="_blank">
              <Button size="sm">Buka Public Link</Button>
            </Link>
            <CopyProfileLinkButton username={user.username || "creator"} />
          </div>
        </Card>

        <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
          <p className="text-sm font-medium text-[#655952]">Status akun</p>
          <h2 className="mt-1 font-display text-xl font-semibold text-[#201b18]">Creator Free</h2>
          <p className="mt-2 text-sm leading-6 text-[#5f524b]">
            Maksimal 10 custom links untuk plan Free. Upgrade plan tersedia di menu Billing.
          </p>
          <Link href="/dashboard/billing" className="mt-4 inline-block">
            <Button variant="secondary" size="sm">
              Lihat Detail Plan
            </Button>
          </Link>
        </Card>
      </section>

      {hasNoData ? (
        <Card className="dashboard-clean-card border-dashed border-[#d9cec7] bg-[#f8f3ef] p-5">
          <h2 className="font-display text-xl font-semibold text-[#201b18]">
            Mulai bangun halaman Showreels kamu
          </h2>
          <p className="mt-2 text-sm text-[#5e514b]">
            Tambahkan bio, link sosial, dan portofolio pertamamu untuk tampil lebih profesional.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/dashboard/link-builder">
              <Button>
                <Plus className="h-4 w-4" />
                Mulai dari Link Builder
              </Button>
            </Link>
            <Link href="/dashboard/profile">
              <Button variant="secondary">
                <UserRoundPen className="h-4 w-4" />
                Lengkapi Profile
              </Button>
            </Link>
          </div>
        </Card>
      ) : null}

      <section>
        <div className="mb-3">
          <p className="text-sm font-medium text-[#655952]">Analytics Summary</p>
          <h2 className="font-display text-2xl font-semibold text-[#201b18]">Ringkasan performa</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {metricCards.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.label}
                className="dashboard-clean-card border-border bg-surface p-4"
              >
                <div className="flex items-center gap-2">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.className}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-xs font-semibold text-[#71625a]">{item.label}</p>
                </div>
                <p className="mt-3 font-display text-2xl font-semibold text-[#201b18]">{item.value}</p>
                <p className="mt-1 text-xs text-[#6a5d56]">{item.helper}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <p className="text-sm font-medium text-[#655952]">Quick Actions</p>
          <h2 className="font-display text-2xl font-semibold text-[#201b18]">Aksi cepat creator</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((item) => (
            <Card key={item.href} className="dashboard-clean-card border-border bg-surface p-4">
              <h3 className="text-base font-semibold text-[#201b18]">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-[#5f524b]">{item.description}</p>
              <Link href={item.href} className="mt-4 inline-block">
                <Button size="sm" variant="secondary">
                  {item.cta}
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <DashboardLivePreviewCard
          username={user.username || "creator"}
          displayName={user.name || "Creator"}
          role={user.role || ""}
          bio={user.bio || ""}
          links={normalizedLinks}
        />
      </section>

      <section>
        <Card className="dashboard-clean-card border-border bg-surface">
          <div className="mb-4">
            <h2 className="font-display text-xl font-semibold text-[#201b18]">Video Portofolio Saya</h2>
            <p className="text-sm text-[#5f524b]">
              Kelola video public, semi-private, private, dan draft dari satu tempat.
            </p>
          </div>

          {myVideos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#d9cec7] bg-[#f6f1ed] p-8 text-center">
              <FolderOpen className="mx-auto h-8 w-8 text-[#6a5d56]" />
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
      </section>
    </div>
  );
}
