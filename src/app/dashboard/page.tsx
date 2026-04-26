import Link from "next/link";
import { count, desc, eq, or } from "drizzle-orm";
import {
  BarChart3,
  CreditCard,
  Lock,
  MousePointerClick,
  Plus,
  Share2,
  Sparkles,
  UploadCloud,
  Video,
  Wand2,
} from "lucide-react";
import { CreatorTrafficPanel } from "@/components/dashboard/creator-traffic-panel";
import { ShareProfileActions } from "@/components/dashboard/share-profile-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db, isDatabaseConfigured } from "@/db";
import { videos, visitorEvents } from "@/db/schema";
import { normalizeCustomLinks } from "@/lib/profile-utils";
import { requireCurrentUser } from "@/server/current-user";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";

type QuickAction = {
  href: string;
  title: string;
  description: string;
  cta: string;
  icon: typeof Wand2;
  locked?: boolean;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const entitlementState = await getCreatorEntitlementsForUser(user.id);
  const planName = entitlementState.effectivePlan.planName;
  const canUseBuildLink = planName !== "free";

  const myVideos = isDatabaseConfigured
    ? await db.query.videos.findMany({
        where: eq(videos.userId, user.id),
        orderBy: desc(videos.createdAt),
        columns: {
          id: true,
          title: true,
          visibility: true,
          publicSlug: true,
        },
      })
    : [];

  const normalizedLinks = normalizeCustomLinks(user.customLinks);
  const activeLinks = normalizedLinks.filter((link) => link.enabled !== false);
  const publicVideos = myVideos.filter(
    (video) => video.visibility === "public" || video.visibility === "semi_private"
  );
  const profilePath = `/creator/${user.username || "creator"}`;

  const totalViews = isDatabaseConfigured
    ? await (async () => {
        const conditions = [eq(visitorEvents.path, profilePath)];
        for (const video of publicVideos) {
          if (video.publicSlug) {
            conditions.push(eq(visitorEvents.path, `/v/${video.publicSlug}`));
          }
        }

        const [row] = await db
          .select({ value: count() })
          .from(visitorEvents)
          .where(or(...conditions));
        return Number(row?.value || 0);
      })()
    : 0;

  const metricCards = [
    {
      label: "Total Link",
      value: activeLinks.length,
      helper: "Block aktif di halaman publik",
      icon: Wand2,
    },
    {
      label: "Total Video",
      value: myVideos.length,
      helper: "Semua video portfolio",
      icon: Video,
    },
    {
      label: "Video Public",
      value: publicVideos.length,
      helper: "Siap dilihat client",
      icon: UploadCloud,
    },
    {
      label: "Total Click/View",
      value: totalViews,
      helper: "Kunjungan profil dan video",
      icon: MousePointerClick,
    },
  ] as const;

  const quickActions: QuickAction[] = [
    {
      href: canUseBuildLink ? "/dashboard/link-builder" : "/dashboard/billing",
      title: "Build Link",
      description: canUseBuildLink
        ? "Susun halaman creator, block, preview, dan publish."
        : "Upgrade ke Creator untuk membuka Build Link.",
      cta: canUseBuildLink ? "Buka Builder" : "Upgrade Creator",
      icon: canUseBuildLink ? Wand2 : Lock,
      locked: !canUseBuildLink,
    },
    {
      href: "/dashboard/videos/new",
      title: "Upload Video",
      description: "Tambah video portfolio dan hubungkan ke profil creator.",
      cta: "Upload Video",
      icon: UploadCloud,
    },
    {
      href: "/dashboard/analytics",
      title: "Analytics",
      description: "Pantau traffic, view, dan halaman yang paling aktif.",
      cta: "Lihat Analytics",
      icon: BarChart3,
    },
    {
      href: "/dashboard/billing",
      title: "Billing",
      description: "Cek paket aktif, perpanjang, atau stop paket.",
      cta: "Kelola Billing",
      icon: CreditCard,
    },
  ];

  return (
    <div className="space-y-5">
      <Card className="dashboard-clean-card overflow-hidden border-[#cfddf5] bg-white p-0">
        <div className="grid gap-0 lg:grid-cols-[1.18fr_0.82fr]">
          <div className="p-5 sm:p-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#cfe0ff] bg-[#edf4ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#2f73ff]">
              <Sparkles className="h-3.5 w-3.5" />
              Dashboard Creator
            </div>
            <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold tracking-[-0.04em] text-[#142033] sm:text-4xl">
              Selamat datang, {user.name || "Creator"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#55709d] sm:text-base">
              Kelola link publik, video portfolio, analytics, dan billing dalam satu workspace yang rapi.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link href={canUseBuildLink ? "/dashboard/link-builder" : "/dashboard/billing"}>
                <Button>
                  {canUseBuildLink ? <Wand2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {canUseBuildLink ? "Mulai Build Link" : "Unlock Build Link"}
                </Button>
              </Link>
              <Link href="/dashboard/videos/new">
                <Button variant="secondary">
                  <Plus className="h-4 w-4" />
                  Upload Video
                </Button>
              </Link>
            </div>
          </div>
          <div className="border-t border-[#dbe7f8] bg-[radial-gradient(circle_at_top_right,#dceaff,transparent_36%),linear-gradient(180deg,#f8fbff,#edf4ff)] p-5 sm:p-7 lg:border-l lg:border-t-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#55709d]">
              Public Creator Page
            </p>
            <div className="mt-3 rounded-[1.35rem] border border-[#cfe0ff] bg-white/88 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#142033]">{profilePath}</p>
                  <p className="mt-1 text-xs text-[#6078a2]">Share profil ke client, bio, dan social media.</p>
                </div>
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2f73ff] text-white">
                  <Share2 className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-4">
                <ShareProfileActions username={user.username || "creator"} iconOnlyOnMobile />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="dashboard-kpi-card p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf4ff] text-[#2f73ff]">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-[#d6e4fb] bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6078a2]">
                  Insight
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold text-[#55709d]">{item.label}</p>
              <p className="mt-1 font-display text-3xl font-semibold tracking-[-0.04em] text-[#142033]">
                {formatNumber(item.value)}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#6078a2]">{item.helper}</p>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <CreatorTrafficPanel compact periodMode="dashboard" />

        <Card className="dashboard-clean-card border-[#cfddf5] bg-white p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2f73ff]">
                Quick Action
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[#142033]">Aksi utama creator</h2>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            {quickActions.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} href={item.href} className="group block">
                  <div className="flex h-full items-center gap-3 rounded-2xl border border-[#dbe7f8] bg-[#f8fbff] p-3 transition group-hover:-translate-y-0.5 group-hover:border-[#a8c8ff] group-hover:bg-white group-hover:shadow-sm">
                    <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.locked ? "bg-amber-50 text-amber-600" : "bg-[#edf4ff] text-[#2f73ff]"}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-[#142033]">{item.title}</p>
                        {item.locked ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            Locked
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#6078a2]">{item.description}</p>
                    </div>
                    <span className="hidden rounded-full border border-[#d6e4fb] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f73ff] sm:inline-flex">
                      {item.cta}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </section>
    </div>
  );
}
