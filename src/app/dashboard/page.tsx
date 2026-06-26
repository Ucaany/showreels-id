import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowUpRight,
  FilmIcon,
  EyeIcon,
  Link2Icon,
  BarChart3Icon,
  PlusIcon,
  ExternalLinkIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Delta, DeltaIcon, DeltaValue } from "@/components/delta";
import { NotificationInboxPanel } from "@/components/dashboard/notification-inbox-panel";
import { OnboardingReminderCard } from "@/components/dashboard/onboarding-reminder-card";
import { normalizeCustomLinks } from "@/lib/profile-utils";
import { requireCurrentUser } from "@/server/current-user";
import { getDashboardMetrics } from "@/server/dashboard-data";
import { getOrCreateUserOnboarding } from "@/server/onboarding";

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

type StatCardProps = {
  label: string;
  value: string;
  delta: number;
  hint: string;
  href: string;
};

function StatCard({ label, value, delta, hint, href }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-xs">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-balance font-semibold text-2xl tabular-nums tracking-tight">{value}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <Delta value={delta} variant="default">
            <DeltaIcon />
            <DeltaValue />
          </Delta>
          <span className="text-pretty text-muted-foreground">{hint}</span>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Lihat
          <ArrowUpRight className="size-3" />
        </Link>
      </CardFooter>
    </Card>
  );
}

function VideoListCard({
  videos,
  username,
}: {
  videos: { id: string; title: string; visibility: string; publicSlug: string | null }[];
  username: string | null;
}) {
  const recent = videos.slice(0, 5);

  return (
    <Card className="md:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Portfolio Terbaru</CardTitle>
        <Link
          href="/dashboard/videos/new"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
        >
          <PlusIcon className="size-3.5" />
          Tambah
        </Link>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <FilmIcon className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Belum ada portfolio. Tambahkan video pertamamu.</p>
            <Link
              href="/dashboard/videos/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
            >
              <PlusIcon className="size-4" />
              Tambah Video
            </Link>
          </div>
        ) : (
          <ul className="divide-y">
            {recent.map((video) => (
              <li key={video.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <FilmIcon className="size-4 text-muted-foreground" />
                  </div>
                  <p className="truncate text-sm font-medium">{video.title}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={video.visibility === "public" ? "default" : "secondary"}>
                    {video.visibility === "public" ? "Publik" : video.visibility === "draft" ? "Draft" : "Private"}
                  </Badge>
                  {video.visibility === "public" && video.publicSlug && (
                    <a
                      href={`/v/${video.publicSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Lihat video"
                      className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <ExternalLinkIcon className="size-3.5" />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      {recent.length > 0 && (
        <CardFooter>
          <Link
            href="/dashboard/videos"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Lihat semua portfolio
            <ArrowUpRight className="size-3.5" />
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}

function QuickLinksCard({ username }: { username: string | null }) {
  const actions = [
    { label: "Kelola Link Bio", href: "/dashboard/link-builder", icon: Link2Icon },
    { label: "Lihat Analytics", href: "/dashboard/analytics", icon: BarChart3Icon },
    { label: "Edit Profile", href: "/dashboard/profile", icon: EyeIcon },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Akses Cepat</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              {action.label}
            </Link>
          );
        })}
        {username && (
          <a
            href={`/creator/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-2.5 rounded-lg bg-secondary px-3 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            <ExternalLinkIcon className="size-4 shrink-0 text-muted-foreground" />
            Lihat Profile Publik
          </a>
        )}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await requireCurrentUser();

  let onboarding: Awaited<ReturnType<typeof getOrCreateUserOnboarding>>;
  try {
    onboarding = await getOrCreateUserOnboarding({
      userId: user.id,
      customLinks: user.customLinks,
      createdAt: user.createdAt,
      profile: {
        fullName: user.name,
        username: user.username,
        role: user.role,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error("dashboard_page_data_error", error);
    onboarding = {
      userId: user.id,
      onboardingCompleted: true,
      onboardingSkipped: false,
      firstLinkCreated: false,
      firstVideoUploaded: false,
      hasPublicProfile: Boolean(user.name && user.username),
      currentStep: 4,
      progressPayload: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  let metrics: Awaited<ReturnType<typeof getDashboardMetrics>>;
  try {
    metrics = await getDashboardMetrics({
      userId: user.id,
      username: user.username || "creator",
    });
  } catch (error) {
    console.error("dashboard_metrics_error", error);
    metrics = { totalVideos: 0, publicVideos: 0, totalViews: 0, videoSummaries: [] };
  }

  const normalizedLinks = normalizeCustomLinks(user.customLinks);
  const activeLinks = normalizedLinks.filter((link) => link.enabled !== false);

  const stats: StatCardProps[] = [
    {
      label: "Total Video",
      value: formatNumber(metrics.totalVideos),
      delta: 0,
      hint: "portfolio kamu",
      href: "/dashboard/videos",
    },
    {
      label: "Video Publik",
      value: formatNumber(metrics.publicVideos),
      delta: 0,
      hint: "bisa dilihat orang",
      href: "/dashboard/videos",
    },
    {
      label: "Total Views",
      value: formatNumber(metrics.totalViews),
      delta: 0,
      hint: "kunjungan ke profilemu",
      href: "/dashboard/analytics",
    },
    {
      label: "Link Aktif",
      value: formatNumber(activeLinks.length),
      delta: 0,
      hint: "di link bio kamu",
      href: "/dashboard/link-builder",
    },
  ];

  return (
    <div className="space-y-6">
      {!onboarding.onboardingCompleted && (
        <OnboardingReminderCard userId={user.id} resumeHref="/onboarding" />
      )}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Halo, {user.name || "Creator"} 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola portfolio, link bio, dan analytics showreels.id kamu dari sini.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <VideoListCard videos={metrics.videoSummaries} username={user.username} />
        <QuickLinksCard username={user.username} />
      </div>

      <Suspense fallback={<div className="h-40 animate-pulse rounded-xl border bg-muted" />}>
        <NotificationInboxPanel compact />
      </Suspense>
    </div>
  );
}
