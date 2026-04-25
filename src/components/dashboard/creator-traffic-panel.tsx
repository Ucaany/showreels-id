"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Clock3, Eye, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { TrafficLineChart } from "@/components/dashboard/traffic-line-chart";

type SummaryPayload = {
  totalViews: number;
  uniqueVisitors: number;
  topPage: string | null;
  topPageViews: number;
  appliedPeriod?: PeriodValue;
  analyticsMaxDays?: number;
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

type Recent = {
  id: string;
  label: string;
  path: string;
  createdAt: string;
};

type PeriodValue = "today" | "7d" | "30d" | "custom";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function CreatorTrafficPanel({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
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
  });
  const [points, setPoints] = useState<Point[]>([]);
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [analyticsMaxDays, setAnalyticsMaxDays] = useState(30);
  const [appliedPeriod, setAppliedPeriod] = useState<PeriodValue>("7d");

  const query = useMemo(() => {
    const resolvedPeriod = analyticsMaxDays < 30 && period === "30d" ? "7d" : period;
    const params = new URLSearchParams();
    params.set("period", resolvedPeriod);
    if (resolvedPeriod === "custom" && start && end) {
      params.set("start", start);
      params.set("end", end);
    }
    return params.toString();
  }, [analyticsMaxDays, period, start, end]);

  useEffect(() => {
    let isCancelled = false;
    const run = async () => {
      setLoading(true);
      setError("");
      const [summaryRes, trafficRes, topRes] = await Promise.all([
        fetch(`/api/analytics/summary?${query}`),
        fetch(`/api/analytics/traffic?${query}`),
        fetch(`/api/analytics/top-pages?${query}`),
      ]);

      if (!summaryRes.ok || !trafficRes.ok || !topRes.ok) {
        if (!isCancelled) {
          setError("Gagal memuat data analytics.");
          setLoading(false);
        }
        return;
      }

      const [summaryPayload, trafficPayload, topPayload] = await Promise.all([
        summaryRes.json() as Promise<SummaryPayload>,
        trafficRes.json() as Promise<{ points: Point[] }>,
        topRes.json() as Promise<{ topPages: TopPage[]; recent: Recent[] }>,
      ]);

      if (isCancelled) return;

      setSummary({
        totalViews: summaryPayload.totalViews || 0,
        uniqueVisitors: summaryPayload.uniqueVisitors || 0,
        topPage: summaryPayload.topPage || null,
        topPageViews: summaryPayload.topPageViews || 0,
      });
      setAppliedPeriod(summaryPayload.appliedPeriod || "7d");
      setAnalyticsMaxDays(summaryPayload.analyticsMaxDays || 30);
      setPoints(trafficPayload.points || []);
      setTopPages(topPayload.topPages || []);
      setRecent(topPayload.recent || []);
      setLoading(false);
    };

    void run();
    return () => {
      isCancelled = true;
    };
  }, [query]);

  return (
    <Card className={`dashboard-clean-card border-border bg-surface p-4 sm:p-5 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#685b54]">Traffic Overview</p>
          <h2 className="font-display text-2xl font-semibold text-[#201b18]">
            Analytics Trafik Creator
          </h2>
          <p className="mt-1 text-sm text-[#5f524b]">
            Pantau kunjungan profil dan video publik secara interaktif.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label="Filter periode analytics"
            value={period}
            onChange={(event) => setPeriod(event.target.value as PeriodValue)}
            className="min-w-[160px]"
          >
            <option value="today">Hari ini</option>
            <option value="7d">7 hari terakhir</option>
            <option value="30d" disabled={analyticsMaxDays < 30}>
              {analyticsMaxDays < 30 ? "30 hari (Pro/Business)" : "30 hari terakhir"}
            </option>
            <option value="custom">Custom range</option>
          </Select>
        </div>
      </div>
      {appliedPeriod !== period ? (
        <p className="mt-2 text-xs text-[#6c5f58]">
          Periode disesuaikan otomatis ke {appliedPeriod.toUpperCase()} sesuai limit plan.
        </p>
      ) : null}

      {period === "custom" ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="text-xs font-medium text-[#5f524b]">
            Mulai
            <input
              type="date"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[#d7cec7] bg-white px-3 text-sm text-[#201b18] outline-none focus:border-[#ef5f49] focus:ring-2 focus:ring-[#f1b8ad]"
            />
          </label>
          <label className="text-xs font-medium text-[#5f524b]">
            Sampai
            <input
              type="date"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[#d7cec7] bg-white px-3 text-sm text-[#201b18] outline-none focus:border-[#ef5f49] focus:ring-2 focus:ring-[#f1b8ad]"
            />
          </label>
          <p className="text-xs text-[#6c5f58] sm:col-span-2">
            Range custom mengikuti limit plan maksimal {analyticsMaxDays} hari.
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#e4dad4] bg-white p-4">
          <div className="flex items-center gap-2 text-[#5f524b]">
            <Eye className="h-4 w-4 text-[#2f73ff]" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em]">Total Views</p>
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-[#201b18]">
            {summary.totalViews}
          </p>
        </div>
        <div className="rounded-2xl border border-[#e4dad4] bg-white p-4">
          <div className="flex items-center gap-2 text-[#5f524b]">
            <Activity className="h-4 w-4 text-[#2f73ff]" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em]">
              Unique Visitors
            </p>
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-[#201b18]">
            {summary.uniqueVisitors}
          </p>
        </div>
        <div className="rounded-2xl border border-[#e4dad4] bg-white p-4">
          <div className="flex items-center gap-2 text-[#5f524b]">
            <MapPin className="h-4 w-4 text-[#2f73ff]" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em]">Top Page</p>
          </div>
          <p className="mt-2 truncate text-sm font-semibold text-[#201b18]">
            {summary.topPage || "Belum ada data"}
          </p>
          <p className="text-xs text-[#61554d]">{summary.topPageViews} views</p>
        </div>
        <div className="rounded-2xl border border-[#e4dad4] bg-white p-4">
          <div className="flex items-center gap-2 text-[#5f524b]">
            <Clock3 className="h-4 w-4 text-[#2f73ff]" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em]">
              Recent Activity
            </p>
          </div>
          <p className="mt-2 text-sm text-[#201b18]">
            {recent.length === 0 ? "Belum ada traffic terbaru." : `${recent.length} event terakhir`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 rounded-2xl border border-[#e4dad4] bg-white p-8 text-center text-sm text-[#665851]">
          Memuat analytics trafik...
        </div>
      ) : error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : (
        <div className={`mt-4 grid gap-4 ${compact ? "xl:grid-cols-[minmax(0,1fr)_320px]" : "xl:grid-cols-[minmax(0,1fr)_360px]"}`}>
          <TrafficLineChart points={points} />
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#e4dad4] bg-white p-4">
              <h3 className="text-sm font-semibold text-[#201b18]">Top Pages</h3>
              <div className="mt-3 space-y-2">
                {topPages.length === 0 ? (
                  <p className="text-sm text-[#6b5e56]">Belum ada traffic.</p>
                ) : (
                  topPages.slice(0, compact ? 4 : 6).map((item, index) => (
                    <div
                      key={`${item.path}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#efe6e0] bg-[#fffaf7] px-3 py-2"
                    >
                      <p className="truncate text-sm font-medium text-[#201b18]">{item.label}</p>
                      <span className="text-xs font-semibold text-[#61544d]">{item.views}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e4dad4] bg-white p-4">
              <h3 className="text-sm font-semibold text-[#201b18]">Recent Traffic</h3>
              <div className="mt-3 space-y-2">
                {recent.length === 0 ? (
                  <p className="text-sm text-[#6b5e56]">Belum ada event terbaru.</p>
                ) : (
                  recent.slice(0, compact ? 4 : 7).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[#efe6e0] bg-[#fffaf7] px-3 py-2"
                    >
                      <p className="text-sm font-medium text-[#201b18]">{item.label}</p>
                      <p className="text-xs text-[#6d6058]">{formatDateTime(item.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
