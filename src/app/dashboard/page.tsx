import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import {
  Coins,
  FolderOpen,
  Link2,
  Plus,
  UserRoundPen,
  Video,
} from "lucide-react";
import { CopyProfileLinkButton } from "@/components/dashboard/copy-profile-link-button";
import { CreatorTrafficPanel } from "@/components/dashboard/creator-traffic-panel";
import { DashboardGreetingCard } from "@/components/dashboard/dashboard-greeting-card";
import { DashboardLivePreviewCard } from "@/components/dashboard/dashboard-live-preview-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db, isDatabaseConfigured } from "@/db";
import { videos } from "@/db/schema";
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
          visibility: true,
          title: true,
          source: true,
          sourceUrl: true,
          thumbnailUrl: true,
          publicSlug: true,
          createdAt: true,
        },
      })
    : [];

  const normalizedLinks = normalizeCustomLinks(user.customLinks);
  const activeLinks = normalizedLinks.filter((link) => link.enabled !== false);
  const publicVideosCount = myVideos.filter((video) => video.visibility === "public").length;
  const draftCount = myVideos.filter((video) => video.visibility === "draft").length;
  const privateCount = myVideos.filter((video) => video.visibility === "private").length;
  const semiPrivateCount = myVideos.filter((video) => video.visibility === "semi_private").length;

  const metricCards = [
    {
      label: "Total Links",
      value: String(activeLinks.length),
      icon: Link2,
      helper: "Link aktif yang tampil",
      className: "bg-[#edf8ef] text-[#2d8555]",
    },
    {
      label: "Video Publik",
      value: String(publicVideosCount),
      icon: FolderOpen,
      helper: "Karya yang bisa diakses client",
      className: "bg-[#fff3ea] text-[#c0672f]",
    },
    {
      label: "Total Video",
      value: String(myVideos.length),
      icon: Video,
      helper: `Draft ${draftCount} - Private ${privateCount}`,
      className: "bg-[#eef2ff] text-[#4659ce]",
    },
    {
      label: "Revenue",
      value: toIdr(0),
      icon: Coins,
      helper: "Terhubung dari billing plan",
      className: "bg-[#f6f0ff] text-[#6d4aad]",
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
      href: "/dashboard/videos",
      title: "Kelola Video",
      description: "Atur semua video portfolio dari satu halaman.",
      cta: "Buka Kelola Video",
    },
    {
      href: "/dashboard/analytics",
      title: "Buka Analytics",
      description: "Lihat performa traffic profile dan video.",
      cta: "Lihat Analytics",
    },
    {
      href: "/dashboard/profile",
      title: "Edit Profile",
      description: "Perbarui identitas visual creator.",
      cta: "Edit Profil",
    },
    {
      href: "/dashboard/billing",
      title: "Kelola Billing",
      description: "Lihat plan aktif, transaksi, dan invoice.",
      cta: "Buka Billing",
    },
  ];

  const hasNoData = activeLinks.length === 0 && publicVideosCount === 0;

  return (
    <div className="space-y-6">
      <DashboardGreetingCard
        locale={locale}
        welcomeLabel={locale === "en" ? "Welcome back," : "Selamat datang kembali,"}
        userName={user.name ?? "Creator"}
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
          <p className="text-sm font-medium text-[#655952]">Link publik siap dibagikan</p>
          <h2 className="mt-1 font-display text-xl font-semibold text-[#201b18] sm:text-2xl">
            Share halaman creator kamu sekarang
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
          <p className="text-sm font-medium text-[#655952]">Creator Summary</p>
          <h2 className="font-display text-2xl font-semibold text-[#201b18]">
            Ringkasan performa dan konten
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

      <CreatorTrafficPanel compact />

      <section>
        <div className="mb-3">
          <p className="text-sm font-medium text-[#655952]">Quick Actions</p>
          <h2 className="font-display text-2xl font-semibold text-[#201b18]">Aksi cepat creator</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold text-[#201b18]">
                  Video Portfolio Summary
                </h2>
                <p className="text-sm text-[#5f524b]">
                  Ringkasan status video portofolio kamu dalam satu panel.
                </p>
              </div>
              <Link href="/dashboard/videos">
                <Button variant="secondary">Buka Kelola Video</Button>
              </Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-[#e4dad4] bg-white px-4 py-3">
                <p className="text-xs text-[#71625a]">Total Video</p>
                <p className="font-display text-2xl font-semibold text-[#201b18]">{myVideos.length}</p>
              </div>
              <div className="rounded-xl border border-[#e4dad4] bg-white px-4 py-3">
                <p className="text-xs text-[#71625a]">Public</p>
                <p className="font-display text-2xl font-semibold text-[#201b18]">{publicVideosCount}</p>
              </div>
              <div className="rounded-xl border border-[#e4dad4] bg-white px-4 py-3">
                <p className="text-xs text-[#71625a]">Semi Private</p>
                <p className="font-display text-2xl font-semibold text-[#201b18]">{semiPrivateCount}</p>
              </div>
              <div className="rounded-xl border border-[#e4dad4] bg-white px-4 py-3">
                <p className="text-xs text-[#71625a]">Draft + Private</p>
                <p className="font-display text-2xl font-semibold text-[#201b18]">
                  {draftCount + privateCount}
                </p>
              </div>
            </div>
          </Card>

          <Card className="dashboard-clean-card border-border bg-surface p-4 sm:p-5">
            <p className="text-sm font-medium text-[#655952]">Section Baru</p>
            <h3 className="mt-1 font-display text-xl font-semibold text-[#201b18]">Kelola Video</h3>
            <p className="mt-2 text-sm leading-6 text-[#5f524b]">
              Masuk ke halaman kelola video untuk tambah, edit, filter, dan publish karya terbaru.
            </p>
            <div className="mt-4 space-y-2">
              <Link href="/dashboard/videos" className="block">
                <Button className="w-full">Buka Kelola Video</Button>
              </Link>
              <Link href="/dashboard/videos/new" className="block">
                <Button variant="secondary" className="w-full">
                  Tambah Video Baru
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
