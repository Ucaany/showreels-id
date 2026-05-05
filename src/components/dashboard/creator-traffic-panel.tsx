"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Clock3,
  Eye,
  Lock,
  MousePointerClick,
  RefreshCcw,
  Share2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { TrafficLineChart } from "@/components/dashboard/traffic-line-chart";
import { cn } from "@/lib/cn";

type PeriodValue = "today" | "7d" | "30d" | "custom";

type SummaryPayload = {
  totalViews: number;
  uniqueVisitors: number;
  topPage: string | null;
  topPageViews: number;
  appliedPeriod?: PeriodValue;
  analyticsMaxDays?: number;
  requestedRangeDays?: number;
  appliedRangeDays?: number;
  planName?: "free" | "creator" | "business";
};

type Point = {
  day: string;
  views: number;
  uniqueVisitors: number;
};

type TopPage = {
  path: string;
  label: string;
  views: number;
};

type RecentActivity = {
  id: string;
  path: string;
  label: string;
  createdAt: string;
};

type TopPagesPayload = {
  topPages: TopPage[];
  recent: RecentActivity[];
};

const numberFormatter = new Intl.NumberFormat("id-ID");

function formatNumber(value: number) {
  return numberFormatter.format(value || 0);
}

function getPeriodLabel(period: PeriodValue) {
  if (period === "today") return "Hari ini";
  if (period === "30d") return "30 hari terakhir";
  if (period === "custom") return "Custom range";
  return "7 hari terakhir";
}

function formatRecentTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Baru saja";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  badge,
  loading,
}: {
  icon: typeof Eye;
  label: string;
  value: string;
  helper: string;
  badge?: string;
  loading: boolean;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700">
          <Icon className="h-4 w-4" />
        </span>
        {badge ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      {loading ? (
        <div className="mt-2 h-8 w-24 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          {value}
        </p>
      )}
      <p className="mt-2 text-xs leading-5 text-slate-500">{helper}</p>
    </article>
  );
}

function InsightListCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        <span className="rounded-full bg-slate-100 p-2 text-slate-500">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-100", className)} />;
}

export function CreatorTrafficPanel({
  compact = false,
  className = "",
  periodMode = "full",
}: {
  compact?: boolean;
  className?: string;
  periodMode?: "dashboard" | "full";
}) {
  const [period, setPeriod] = useState<PeriodValue>("7d");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<SummaryPayload>({
    totalViews: 0,
    uniqueVisitors: 0,
    topPage: null,
    topPageViews: 0,
    requestedRangeDays: 0,
    appliedRangeDays: 0,
    planName: "free",
  });
  const [points, setPoints] = useState<Point[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [recent, setRecent] = useState<RecentActivity[]>([]);
  const [analyticsMaxDays, setAnalyticsMaxDays] = useState(30);
  const [appliedPeriod, setAppliedPeriod] = useState<PeriodValue>("7d");

  const effectivePeriod: PeriodValue =
    periodMode === "dashboard" && (period === "today" || period === "custom") ? "7d" : period;

  const query = useMemo(() => {
    const resolvedPeriod = analyticsMaxDays < 30 && effectivePeriod === "30d" ? "7d" : effectivePeriod;
    const params = new URLSearchParams();
    params.set("period", resolvedPeriod);

    if (periodMode === "full" && resolvedPeriod === "custom" && start && end) {
      params.set("start", start);
      params.set("end", end);
    }

    return params.toString();
  }, [analyticsMaxDays, effectivePeriod, end, periodMode, start]);

  const isThirtyDayLocked = analyticsMaxDays < 30;
  const lockedCountdownDays = Math.max(0, 30 - analyticsMaxDays);
  const hasRangeClamp =
    (summary.requestedRangeDays || 0) > 0 &&
    (summary.appliedRangeDays || 0) > 0 &&
    (summary.requestedRangeDays || 0) > (summary.appliedRangeDays || 0);
  const hasTraffic = summary.totalViews > 0 || summary.uniqueVisitors > 0 || points.some((point) => point.views > 0);
  const averageViews = points.length > 0 ? Math.round(summary.totalViews / points.length) : 0;
  const engagementRate = summary.totalViews > 0 ? Math.round((summary.uniqueVisitors / summary.totalViews) * 100) : 0;
  const topPageShare = summary.totalViews > 0 ? Math.round((summary.topPageViews / summary.totalViews) * 100) : 0;

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        const [summaryRes, trafficRes, topPagesRes] = await Promise.all([
          fetch(`/api/analytics/summary?${query}`),
          fetch(`/api/analytics/traffic?${query}`),
          fetch(`/api/analytics/top-pages?${query}`),
        ]);

        if (!summaryRes.ok || !trafficRes.ok || !topPagesRes.ok) {
          if (!isCancelled) {
            setError("Gagal memuat analytics.");
            setLoading(false);
          }
          return;
        }

        const [summaryPayload, trafficPayload, topPagesPayload] = await Promise.all([
          summaryRes.json() as Promise<SummaryPayload>,
          trafficRes.json() as Promise<{ points: Point[] }>,
          topPagesRes.json() as Promise<TopPagesPayload>,
        ]);

        if (isCancelled) return;

        setSummary({
          totalViews: summaryPayload.totalViews || 0,
          uniqueVisitors: summaryPayload.uniqueVisitors || 0,
          topPage: summaryPayload.topPage || null,
          topPageViews: summaryPayload.topPageViews || 0,
          requestedRangeDays: summaryPayload.requestedRangeDays || 0,
          appliedRangeDays: summaryPayload.appliedRangeDays || 0,
          planName: summaryPayload.planName || "free",
        });
        setAppliedPeriod(summaryPayload.appliedPeriod || "7d");
        setAnalyticsMaxDays(summaryPayload.analyticsMaxDays || 30);
        setPoints(trafficPayload.points || []);
        setTopPages(topPagesPayload.topPages || []);
        setRecent(topPagesPayload.recent || []);
        setLoading(false);
      } catch {
        if (!isCancelled) {
          setError("Gagal memuat analytics.");
          setLoading(false);
        }
      }
    };

    void run();
    return () => {
      isCancelled = true;
    };
  }, [query]);

  const metrics = [
    {
      icon: Eye,
      label: "Total Views",
      value: formatNumber(summary.totalViews),
      helper: `Akumulasi ${getPeriodLabel(appliedPeriod).toLowerCase()}`,
      badge: hasTraffic ? "+aktif" : "0 data",
    },
    {
      icon: Activity,
      label: "Unique Visitors",
      value: formatNumber(summary.uniqueVisitors),
      helper: "Estimasi pengunjung unik pada periode ini",
      badge: engagementRate > 0 ? `${engagementRate}%` : "baru",
    },
    {
      icon: MousePointerClick,
      label: "Top Page Views",
      value: formatNumber(summary.topPageViews),
      helper: summary.topPage || "Belum ada halaman unggulan",
      badge: topPageShare > 0 ? `${topPageShare}% share` : "insight",
    },
    {
      icon: TrendingUp,
      label: "Avg. Daily Views",
      value: formatNumber(averageViews),
      helper: "Rata-rata views harian dari titik chart",
      badge: "vs period",
    },
  ];

  return (
    <section className={cn("space-y-5", compact ? "" : "", className)}>
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Filter Analytics
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Periode aktif: <span className="font-medium text-slate-700">{getPeriodLabel(appliedPeriod)}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              Limit plan: {analyticsMaxDays} hari
            </span>
            <Select
              aria-label="Filter periode analytics"
              value={effectivePeriod}
              onChange={(event) => setPeriod(event.target.value as PeriodValue)}
              className="h-10 w-full rounded-xl border-slate-200 px-3 text-slate-900 ring-slate-300 focus:border-zinc-800 min-[430px]:w-auto min-[430px]:min-w-[160px]"
            >
              <option value="7d">7 hari terakhir</option>
              <option value="30d">{isThirtyDayLocked ? "Terkunci - 30 hari" : "30 hari terakhir"}</option>
              {periodMode === "full" ? <option value="today">Hari ini</option> : null}
              {periodMode === "full" ? <option value="custom">Custom range</option> : null}
            </Select>
          </div>
        </div>

        {periodMode === "full" && effectivePeriod === "custom" ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-medium text-slate-600">
              Mulai
              <input
                type="date"
                value={start}
                onChange={(event) => setStart(event.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-zinc-800 focus:ring-2 focus:ring-slate-300"
              />
            </label>
            <label className="text-xs font-medium text-slate-600">
              Sampai
              <input
                type="date"
                value={end}
                onChange={(event) => setEnd(event.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-zinc-800 focus:ring-2 focus:ring-slate-300"
              />
            </label>
            <p className="text-xs text-slate-500 sm:col-span-2">
              Range custom mengikuti limit plan maksimal {analyticsMaxDays} hari. Jika melebihi limit, data otomatis disesuaikan.
            </p>
          </div>
        ) : null}

        {periodMode === "full" && (appliedPeriod !== effectivePeriod || hasRangeClamp) ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700">Range disesuaikan</p>
            <p className="mt-1 text-sm text-slate-500">
              {hasRangeClamp
                ? `Permintaan ${summary.requestedRangeDays} hari disesuaikan ke ${summary.appliedRangeDays} hari sesuai limit plan.`
                : `Periode disesuaikan otomatis ke ${appliedPeriod.toUpperCase()} sesuai limit plan.`}
            </p>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} loading={loading} />
        ))}
      </div>

      {error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>{error}</p>
            <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
              <RefreshCcw className="h-4 w-4" />
              Coba Lagi
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-12">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6 xl:col-span-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Traffic Overview</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">Analytics Trafik Creator</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Pantau kunjungan profil dan performa video publik secara interaktif.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-white">Views</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">Visitors</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">Clicks soon</span>
            </div>
          </div>

          <div className="mt-5">
            {loading ? <SkeletonBlock className="h-72 rounded-2xl" /> : <TrafficLineChart points={points} />}
          </div>
        </article>

        <aside className="space-y-5 xl:col-span-4">
          <article className="rounded-3xl bg-slate-900 p-5 text-white shadow-sm md:p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-white">
                {isThirtyDayLocked ? <Lock className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80">
                {isThirtyDayLocked ? "Plan terbatas" : "Insight aktif"}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-semibold">Buka insight yang lebih mendalam</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Lihat halaman paling aktif, pola kunjungan terbaru, dan rekomendasi tindakan untuk menaikkan traffic profil.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li className="flex gap-2"><span className="text-white">•</span> Link yang paling banyak dikunjungi</li>
              <li className="flex gap-2"><span className="text-white">•</span> Aktivitas terbaru visitor</li>
              <li className="flex gap-2"><span className="text-white">•</span> Rekomendasi optimasi profil</li>
            </ul>
            <Link href={isThirtyDayLocked ? "/dashboard/billing" : "/dashboard/link-builder"} className="mt-5 inline-flex">
              <Button variant="secondary" size="sm" className="border-white/20 bg-white text-slate-900 hover:bg-slate-100">
                <Sparkles className="h-4 w-4" />
                {isThirtyDayLocked ? "Upgrade Plan" : "Optimasi Link"}
              </Button>
            </Link>
            {isThirtyDayLocked ? (
              <p className="mt-3 text-xs text-slate-400">Sisa {lockedCountdownDays} hari menuju akses 30 hari.</p>
            ) : null}
          </article>

          <InsightListCard title="Recommendations" description="Aksi cepat berdasarkan kondisi analytics saat ini.">
            <div className="space-y-3">
              {[
                hasTraffic ? "Promosikan halaman dengan traffic terbaik minggu ini." : "Bagikan public link untuk mulai mengumpulkan traffic.",
                "Pastikan CTA utama terlihat di bagian atas Link Builder.",
                "Aktifkan video publik agar pengunjung punya konteks portfolio.",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  <Share2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </InsightListCard>
        </aside>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <InsightListCard title="Top Performing Pages" description="Halaman atau video dengan kunjungan tertinggi.">
          {loading ? (
            <div className="space-y-3"><SkeletonBlock className="h-12" /><SkeletonBlock className="h-12" /><SkeletonBlock className="h-12" /></div>
          ) : topPages.length > 0 ? (
            <div className="space-y-3">
              {topPages.slice(0, 4).map((page, index) => (
                <div key={page.path} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{index + 1}. {page.label}</p>
                    <p className="truncate text-xs text-slate-400">{page.path}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">{formatNumber(page.views)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">Belum ada data halaman populer untuk periode ini.</p>
          )}
        </InsightListCard>

        <InsightListCard title="Recent Activity" description="Aktivitas visitor terbaru dari profil dan video publik.">
          {loading ? (
            <div className="space-y-3"><SkeletonBlock className="h-12" /><SkeletonBlock className="h-12" /><SkeletonBlock className="h-12" /></div>
          ) : recent.length > 0 ? (
            <div className="space-y-3">
              {recent.slice(0, 4).map((item) => (
                <div key={item.id} className="flex gap-3 rounded-xl bg-slate-50 p-3">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-400">{formatRecentTime(item.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">Belum ada aktivitas terbaru yang tercatat.</p>
          )}
        </InsightListCard>

        <InsightListCard title="Audience Snapshot" description="Snapshot sederhana berdasarkan data yang tersedia saat ini.">
          <div className="grid gap-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Sumber Traffic</p>
              <p className="mt-2 text-sm text-slate-600">Direct / Social belum dipisahkan oleh tracking saat ini.</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Device & Lokasi</p>
              <p className="mt-2 text-sm text-slate-600">Detail audience tersedia sebagai area pengembangan berikutnya.</p>
            </div>
          </div>
        </InsightListCard>
      </div>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Lifetime Summary</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Ringkasan periode aktif</h3>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {getPeriodLabel(appliedPeriod)}
          </span>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Views", formatNumber(summary.totalViews)],
            ["Visitors", formatNumber(summary.uniqueVisitors)],
            ["Top Page", formatNumber(summary.topPageViews)],
            ["Avg Daily", formatNumber(averageViews)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{label}</p>
              <p className="mt-2 text-xl font-semibold text-slate-900">{loading ? "—" : value}</p>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
