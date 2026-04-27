"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Activity, Eye, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { TrafficLineChart } from "@/components/dashboard/traffic-line-chart";

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
  const [analyticsMaxDays, setAnalyticsMaxDays] = useState(30);
  const [appliedPeriod, setAppliedPeriod] = useState<PeriodValue>("7d");

  const effectivePeriod: PeriodValue =
    periodMode === "dashboard" && (period === "today" || period === "custom")
      ? "7d"
      : period;

  const query = useMemo(() => {
    const resolvedPeriod =
      analyticsMaxDays < 30 && effectivePeriod === "30d" ? "7d" : effectivePeriod;
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

  useEffect(() => {
    let isCancelled = false;

    const run = async () => {
      setLoading(true);
      setError("");

      const [summaryRes, trafficRes] = await Promise.all([
        fetch(`/api/analytics/summary?${query}`),
        fetch(`/api/analytics/traffic?${query}`),
      ]);

      if (!summaryRes.ok || !trafficRes.ok) {
        if (!isCancelled) {
          setError("Gagal memuat data analytics.");
          setLoading(false);
        }
        return;
      }

      const [summaryPayload, trafficPayload] = await Promise.all([
        summaryRes.json() as Promise<SummaryPayload>,
        trafficRes.json() as Promise<{ points: Point[] }>,
      ]);

      if (isCancelled) {
        return;
      }

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
      setLoading(false);
    };

    void run();
    return () => {
      isCancelled = true;
    };
  }, [query]);

  return (
    <Card className={`dashboard-panel ${compact ? "p-4" : "p-4 sm:p-5"} ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5f79a8]">
            Traffic Overview
          </p>
          <h2 className="font-display text-2xl font-semibold text-[#1b2e4f]">
            Analytics Trafik Creator
          </h2>
          <p className="mt-1 text-sm text-[#4f658f]">
            Pantau kunjungan profil dan video publik secara interaktif.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <span className="rounded-full border border-[#d5e1f4] bg-[#f6faff] px-2.5 py-1 text-xs font-semibold text-[#56709d]">
            Limit plan: {analyticsMaxDays} hari
          </span>
          <Select
            aria-label="Filter periode analytics"
            value={effectivePeriod}
            onChange={(event) => setPeriod(event.target.value as PeriodValue)}
            className="w-full min-[430px]:w-auto min-[430px]:min-w-[160px]"
          >
            <option value="7d">7 hari terakhir</option>
            <option value="30d">
              {isThirtyDayLocked ? "Terkunci - 30 hari" : "30 hari terakhir"}
            </option>
            {periodMode === "full" ? <option value="today">Hari ini</option> : null}
            {periodMode === "full" ? <option value="custom">Custom range</option> : null}
          </Select>
        </div>
      </div>

      {isThirtyDayLocked ? (
        <div className="mt-3 rounded-2xl border border-[#d3e1f8] bg-gradient-to-r from-[#eff5ff] to-white p-3 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#2f73ff]">
                <Lock className="h-3.5 w-3.5" />
                Analytics Lock
              </p>
              <p className="mt-1 text-sm font-semibold text-[#233d67]">
                Akses analytics 30 hari masih terkunci untuk plan{" "}
                <span className="capitalize">{summary.planName || "free"}</span>.
              </p>
              <p className="mt-1 text-sm text-[#5b7198]">
                Sisa {lockedCountdownDays} hari lagi terkunci menuju akses 30 hari.
              </p>
            </div>
            <Link href="/dashboard/billing" className="w-full sm:w-auto">
              <Button size="sm" className="w-full sm:w-auto">
                <Sparkles className="h-4 w-4" />
                Upgrade Creator/Business
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      {periodMode === "full" && (appliedPeriod !== effectivePeriod || hasRangeClamp) ? (
        <div className="mt-3 rounded-2xl border border-[#d5e1f4] bg-[#f6faff] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2f73ff]">
            Range disesuaikan
          </p>
          <p className="mt-1 text-sm text-[#5b7198]">
            {hasRangeClamp
              ? `Permintaan ${summary.requestedRangeDays} hari disesuaikan ke ${summary.appliedRangeDays} hari sesuai limit plan.`
              : `Periode disesuaikan otomatis ke ${appliedPeriod.toUpperCase()} sesuai limit plan.`}
          </p>
        </div>
      ) : null}

      {periodMode === "full" && effectivePeriod === "custom" ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="text-xs font-medium text-[#4f658f]">
            Mulai
            <input
              type="date"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[#d7e2f5] bg-white px-3 text-sm text-[#1b2e4f] outline-none focus:border-[#2f73ff] focus:ring-2 focus:ring-[#b7d2ff]"
            />
          </label>
          <label className="text-xs font-medium text-[#4f658f]">
            Sampai
            <input
              type="date"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              className="mt-1 h-11 w-full rounded-xl border border-[#d7e2f5] bg-white px-3 text-sm text-[#1b2e4f] outline-none focus:border-[#2f73ff] focus:ring-2 focus:ring-[#b7d2ff]"
            />
          </label>
          <p className="text-xs text-[#5b7198] sm:col-span-2">
            Range custom mengikuti limit plan maksimal {analyticsMaxDays} hari. Jika melebihi
            limit, data otomatis disesuaikan.
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="dashboard-kpi-card p-3.5 sm:p-4">
          <div className="flex items-center gap-2 text-[#4f658f]">
            <Eye className="h-4 w-4 text-[#2f73ff]" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em]">Total Views</p>
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-[#1b2e4f]">
            {summary.totalViews}
          </p>
        </div>
        <div className="dashboard-kpi-card p-3.5 sm:p-4">
          <div className="flex items-center gap-2 text-[#4f658f]">
            <Activity className="h-4 w-4 text-[#2f73ff]" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em]">
              Unique Visitors
            </p>
          </div>
          <p className="mt-2 font-display text-2xl font-semibold text-[#1b2e4f]">
            {summary.uniqueVisitors}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 rounded-2xl border border-[#dce7f8] bg-white p-8 text-center text-sm text-[#5b7198]">
          Memuat analytics trafik...
        </div>
      ) : error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      ) : (
        <div className="mt-4">
          <TrafficLineChart points={points} />
        </div>
      )}
    </Card>
  );
}
