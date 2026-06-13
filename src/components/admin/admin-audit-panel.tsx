"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, PlayCircle, Radar, Route, Server, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { showFeedbackAlert } from "@/lib/feedback-alert";

type Severity = "low" | "medium" | "high" | "critical";
type AuditFinding = { id: string; severity: Severity; category: string; title: string; routeOrEndpoint: string; recommendation: string; status: string; createdAt: string | Date };
type AuditRoute = { id: string; route: string; statusCode: number; loadTimeMs: number; hasTitle: boolean; hasMetaDescription: boolean; errorMessage: string };
type AuditApi = { id: string; endpoint: string; method: string; statusCode: number; latencyMs: number; ok: boolean; errorMessage: string };
type AuditScan = { id: string; status: string; scope: string; healthScore: number; criticalCount: number; highCount: number; mediumCount: number; lowCount: number; createdAt: string | Date; finishedAt: string | Date | null; durationMs: number; errorMessage: string };
export type AuditDashboardData = { latestScan: AuditScan | null; counts: Record<Severity, number>; score: number; statusLabel: string; findings: AuditFinding[]; routes: AuditRoute[]; apis: AuditApi[]; scans: AuditScan[] };

function fmtDate(value?: string | Date | null) { return value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "-"; }
function severityClass(value: Severity) { return value === "critical" ? "bg-rose-600" : value === "high" ? "bg-orange-500" : value === "medium" ? "bg-amber-500" : "bg-sky-500"; }
function scoreClass(score: number) { return score >= 90 ? "text-emerald-600" : score >= 70 ? "text-amber-600" : "text-rose-600"; }

export function AdminAuditPanel({ initialData }: { initialData: AuditDashboardData }) {
  const [data, setData] = useState(initialData);
  const [running, setRunning] = useState(false);

  const refreshDetails = async () => {
    const response = await fetch("/api/admin/audit/details", { cache: "no-store" });
    if (!response.ok) return;
    const details = await response.json();
    setData((prev) => ({ ...prev, ...details }));
  };

  const runAudit = async (scope: "full" | "api" | "routes" | "database" | "seo" | "config" = "full") => {
    setRunning(true);
    const response = await fetch("/api/admin/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scope }) });
    setRunning(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      await showFeedbackAlert({ title: "Audit gagal dijalankan", text: payload?.error || "Server production belum siap menjalankan audit.", icon: "error" });
      return;
    }
    await showFeedbackAlert({ title: "Audit selesai", text: "Dashboard akan memuat hasil terbaru.", icon: "success", timer: 1400 });
    window.location.reload();
  };

  const latest = data.latestScan;
  return <section className="space-y-5">
    <Card className="overflow-hidden border-slate-200 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div><div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100"><Radar className="h-4 w-4" />Website Health Checker</div><h2 className="mt-4 font-display text-3xl font-semibold">Audit Production Terintegrasi</h2><p className="mt-2 max-w-2xl text-sm text-slate-300">Pantau error route, API, database, SEO, security, dan rekomendasi perbaikan langsung dari dashboard admin.</p></div>
        <div className="rounded-3xl border border-white/15 bg-white/10 p-5 text-center backdrop-blur"><p className="text-xs uppercase tracking-[0.18em] text-slate-300">Health Score</p><p className={cn("mt-1 text-6xl font-semibold", latest ? scoreClass(latest.healthScore) : "text-white")}>{latest?.healthScore ?? data.score}</p><p className="text-sm text-slate-300">{data.statusLabel}</p></div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => void runAudit("full")} disabled={running} className="bg-white text-slate-950 hover:bg-slate-100">{running ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}Run Full Audit</Button><Button variant="secondary" onClick={() => void runAudit("api")} disabled={running}>API Only</Button><Button variant="secondary" onClick={() => void runAudit("routes")} disabled={running}>Routes Only</Button><Button variant="secondary" onClick={() => void refreshDetails()}>Refresh</Button></div>
    </Card>

    <div className="grid gap-4 md:grid-cols-4">{(["critical", "high", "medium", "low"] as Severity[]).map((s) => <Card key={s} className="border-slate-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{s}</p><p className="mt-2 text-3xl font-semibold text-slate-950">{data.counts[s] ?? 0}</p><Badge className={cn("mt-2 capitalize", severityClass(s))}>{s} findings</Badge></Card>)}</div>

    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"><Card className="border-slate-200 bg-white p-5"><h3 className="flex items-center gap-2 font-display text-xl font-semibold"><ShieldAlert className="h-5 w-5" />Finding & Rekomendasi</h3><div className="mt-4 space-y-3">{data.findings.slice(0, 12).map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center gap-2"><Badge className={cn("capitalize", severityClass(item.severity))}>{item.severity}</Badge><span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.category}</span></div><p className="mt-2 font-semibold text-slate-950">{item.title}</p><p className="text-sm text-slate-600">{item.routeOrEndpoint || "Global"}</p>{item.recommendation ? <p className="mt-2 rounded-xl bg-white p-3 text-sm text-slate-700">{item.recommendation}</p> : null}</div>)}{!data.findings.length ? <p className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 p-6 text-center text-sm font-semibold text-emerald-700"><CheckCircle2 className="mx-auto mb-2 h-6 w-6" />Belum ada finding kritis dari scan terakhir.</p> : null}</div></Card>
    <Card className="border-slate-200 bg-white p-5"><h3 className="font-display text-xl font-semibold">Riwayat Scan</h3><div className="mt-4 space-y-2">{data.scans.slice(0, 8).map((scan) => <div key={scan.id} className="rounded-2xl border border-slate-200 p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-950">{scan.scope} · {scan.status}</p><span className={cn("font-semibold", scoreClass(scan.healthScore))}>{scan.healthScore}</span></div><p className="text-xs text-slate-500">{fmtDate(scan.createdAt)} · {scan.durationMs}ms</p></div>)}{!data.scans.length ? <p className="text-sm text-slate-500">Belum pernah scan. Klik Run Full Audit.</p> : null}</div></Card></div>

    <div className="grid gap-5 xl:grid-cols-2"><Card className="border-slate-200 bg-white p-5"><h3 className="flex items-center gap-2 font-display text-xl font-semibold"><Route className="h-5 w-5" />Route Checks</h3><div className="mt-4 max-h-[420px] overflow-auto rounded-2xl border border-slate-200"><table className="w-full text-left text-sm"><tbody>{data.routes.map((r) => <tr key={r.id} className="border-b border-slate-100"><td className="p-3 font-medium text-slate-950">{r.route}</td><td className="p-3"><Badge className={r.statusCode >= 400 ? "bg-rose-600" : "bg-emerald-600"}>{r.statusCode}</Badge></td><td className="p-3 text-slate-500">{r.loadTimeMs}ms</td><td className="p-3 text-slate-500">SEO: {r.hasTitle && r.hasMetaDescription ? "OK" : "Check"}</td></tr>)}</tbody></table></div></Card>
    <Card className="border-slate-200 bg-white p-5"><h3 className="flex items-center gap-2 font-display text-xl font-semibold"><Server className="h-5 w-5" />API Checks</h3><div className="mt-4 max-h-[420px] overflow-auto rounded-2xl border border-slate-200"><table className="w-full text-left text-sm"><tbody>{data.apis.map((a) => <tr key={a.id} className="border-b border-slate-100"><td className="p-3 font-medium text-slate-950">{a.method} {a.endpoint}</td><td className="p-3"><Badge className={a.ok ? "bg-emerald-600" : "bg-rose-600"}>{a.statusCode}</Badge></td><td className="p-3 text-slate-500">{a.latencyMs}ms</td><td className="p-3 text-slate-500">{a.errorMessage || "OK"}</td></tr>)}</tbody></table></div></Card></div>
  </section>;
}
