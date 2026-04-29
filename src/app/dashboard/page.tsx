import Link from "next/link";
import { count, desc, eq, inArray, or, sql } from "drizzle-orm";
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
import { OnboardingReminderCard } from "@/components/dashboard/onboarding-reminder-card";
import { ShareProfileActions } from "@/components/dashboard/share-profile-actions";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { Button } from "@/components/ui/button";
import { db, isDatabaseConfigured } from "@/db";
import { videos, visitorEvents } from "@/db/schema";
import { cn } from "@/lib/cn";
import { normalizeCustomLinks } from "@/lib/profile-utils";
import { requireCurrentUser } from "@/server/current-user";
import { getOrCreateUserOnboarding } from "@/server/onboarding";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";

type QuickAction = {
  href: string;
  title: string;
  description: string;
  cta: string;
  icon: typeof Wand2;
  locked?: boolean;
};

type MetricCard = {
  label: string;
  value: number;
  helper: string;
  icon: typeof Wand2;
};

type DashboardPageProps = {
  searchParams?: Promise<{
    onboarding?: string;
  }>;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function BentoCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm md:p-6",
        className
      )}
    >
      {children}
    </section>
  );
}

function HeroCard({
  userName,
  canUseBuildLink,
}: {
  userName: string | null;
  canUseBuildLink: boolean;
}) {
  return (
    <BentoCard className="overflow-hidden lg:col-span-2">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            <Sparkles className="h-3.5 w-3.5" />
            Dashboard Creator
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
            Selamat datang, {userName || "Kreator"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 md:text-base">
            Kelola link publik, video portfolio, analytics, dan billing dari satu workspace Bento Grid yang bersih dan ramah mata.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <Link href={canUseBuildLink ? "/dashboard/link-builder" : "/dashboard/billing"}>
            <Button className="rounded-xl bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700">
              {canUseBuildLink ? <Wand2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              {canUseBuildLink ? "Mulai Build Link" : "Unlock Build Link"}
            </Button>
          </Link>
          <Link href="/dashboard/videos/new">
            <Button
              variant="secondary"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              <Plus className="h-4 w-4" />
              Upload Video
            </Button>
          </Link>
        </div>
      </div>
    </BentoCard>
  );
}

function PublicLinkCard({
  profilePath,
  username,
}: {
  profilePath: string;
  username: string;
}) {
  return (
    <BentoCard className="lg:col-span-1">
      <div className="flex h-full flex-col justify-between gap-6">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Public Link
            </p>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-800 text-white shadow-sm">
              <Share2 className="h-4 w-4" />
            </span>
          </div>
          <h3 className="mt-5 truncate text-xl font-semibold text-slate-900">{profilePath}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Bagikan profil creator, link penting, bio, dan portfolio video ke client.
          </p>
        </div>
        <ShareProfileActions username={username} iconOnlyOnMobile />
      </div>
    </BentoCard>
  );
}

function StatCard({ item }: { item: MetricCard }) {
  const Icon = item.icon;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          {item.label}
        </p>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-5 text-3xl font-semibold tracking-tight text-slate-900">
        {formatNumber(item.value)}
      </p>
      <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
        {item.helper}
      </span>
    </div>
  );
}

function StatsGrid({ metricCards }: { metricCards: MetricCard[] }) {
  return (
    <section className="lg:col-span-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </div>
    </section>
  );
}

function AnalyticsChartCard() {
  return (
    <BentoCard className="lg:col-span-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Analytics Trafik
          </p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">Performa kunjungan publik</h3>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
          7 hari terakhir
        </span>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="relative h-64">
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-slate-100 to-transparent" />
          <div className="absolute inset-0 grid grid-rows-4">
            <span className="border-b border-slate-200" />
            <span className="border-b border-slate-200" />
            <span className="border-b border-slate-200" />
            <span className="border-b border-slate-200" />
          </div>
          <svg
            viewBox="0 0 640 220"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="trafficArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="rgb(39 39 42)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="rgb(255 255 255)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 178 C70 138 105 150 150 118 C205 78 242 102 295 74 C355 42 398 68 440 100 C488 136 530 118 640 56 L640 220 L0 220 Z"
              fill="url(#trafficArea)"
            />
            <path
              d="M0 178 C70 138 105 150 150 118 C205 78 242 102 295 74 C355 42 398 68 440 100 C488 136 530 118 640 56"
              fill="none"
              stroke="rgb(39 39 42)"
              strokeLinecap="round"
              strokeWidth="5"
            />
          </svg>
        </div>
      </div>
    </BentoCard>
  );
}

function QuickActionCard({ actions }: { actions: QuickAction[] }) {
  return (
    <BentoCard className="lg:col-span-1">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
        Quick Action
      </p>
      <h3 className="mt-1 text-xl font-semibold text-slate-900">Aksi utama creator</h3>
      <div className="mt-5 space-y-3">
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.title} href={item.href} className="group block">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition-colors hover:bg-slate-100">
                <span
                  className={cn(
                    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
                    item.locked ? "bg-slate-100 text-slate-500" : "bg-slate-50 text-slate-700"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                    {item.locked ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        Locked
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                    {item.description}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-900">{item.cta}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </BentoCard>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireCurrentUser();
  const params = searchParams ? await searchParams : {};
  const forceOnboarding = params.onboarding === "1";

  const [entitlementState, onboarding] = await Promise.all([
    getCreatorEntitlementsForUser(user.id),
    getOrCreateUserOnboarding({
      userId: user.id,
      customLinks: user.customLinks,
      createdAt: user.createdAt,
      profile: {
        fullName: user.name,
        username: user.username,
        role: user.role,
        bio: user.bio,
      },
    }),
  ]);

  const shouldShowOnboarding =
    !onboarding.onboardingCompleted && (!onboarding.onboardingSkipped || forceOnboarding);

  if (shouldShowOnboarding) {
    return (
      <OnboardingStepper
        initialStatus={onboarding}
        initialUser={{
          fullName: user.name || "",
          username: user.username || "",
          role: user.role || "",
          bio: user.bio || "",
          image: user.image || "",
          coverImageUrl: user.coverImageUrl || "",
        }}
        linkBuilderMax={entitlementState.entitlements.linkBuilderMax}
        planName={entitlementState.effectivePlan.planName}
        subscriptionStatus={entitlementState.effectivePlan.status as "active" | "trial" | "expired" | "failed" | "pending"}
        embedded
      />
    );
  }

  const canUseBuildLink = true;

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
  const publicVideos = myVideos.filter((video) => video.visibility === "public");
  const profilePath = `/creator/${user.username || "creator"}`;

  const totalViews = isDatabaseConfigured
    ? await (async () => {
        const publicVideoPaths = publicVideos
          .map((video) => video.publicSlug?.trim())
          .filter((value): value is string => Boolean(value))
          .map((slug) => `/v/${slug}`);
        const creatorPathPattern = `${profilePath}%`;

        const [row] = await db
          .select({ value: count() })
          .from(visitorEvents)
          .where(
            publicVideoPaths.length > 0
              ? or(
                  sql`${visitorEvents.path} LIKE ${creatorPathPattern}`,
                  inArray(visitorEvents.path, publicVideoPaths)
                )
              : sql`${visitorEvents.path} LIKE ${creatorPathPattern}`
          );
        return Number(row?.value || 0);
      })()
    : 0;

  const metricCards: MetricCard[] = [
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
      label: "Total Click",
      value: totalViews,
      helper: "Event analytics profil dan video",
      icon: MousePointerClick,
    },
  ];

  const quickActions: QuickAction[] = [
    {
      href: canUseBuildLink ? "/dashboard/link-builder" : "/dashboard/billing",
      title: "Build Link",
      description: canUseBuildLink
        ? "Susun halaman creator, block, preview, dan publish."
        : "Upgrade ke Creator untuk membuka Build Link.",
      cta: canUseBuildLink ? "Buka Builder" : "Upgrade Creator",
      icon: canUseBuildLink ? Wand2 : Lock,
      locked: false,
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
    <div className="space-y-6">
      {onboarding.onboardingSkipped && !onboarding.onboardingCompleted ? (
        <OnboardingReminderCard userId={user.id} resumeHref="/dashboard?onboarding=1" />
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        <HeroCard userName={user.name} canUseBuildLink={canUseBuildLink} />
        <PublicLinkCard profilePath={profilePath} username={user.username || "creator"} />
        <StatsGrid metricCards={metricCards} />
        <AnalyticsChartCard />
        <QuickActionCard actions={quickActions} />
      </div>
    </div>
  );
}
