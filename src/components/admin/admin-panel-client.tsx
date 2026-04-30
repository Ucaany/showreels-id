"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Clock3,
  Database,
  Edit3,
  Eye,
  Film,
  HardDrive,
  Loader2,
  Megaphone,
  PlayCircle,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { confirmFeedbackAction, showFeedbackAlert } from "@/lib/feedback-alert";
import type { AdminAnalyticsOverview } from "@/server/admin-analytics";

export type AdminUserItem = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  bio: string;
  city: string;
  contactEmail: string;
  phoneNumber: string;
  websiteUrl: string;
  isBlocked: boolean;
  blockedReason: string;
  createdAt: string;
  videoCount: number;
};

export type AdminVideoItem = {
  id: string;
  title: string;
  description: string;
  visibility: "public" | "draft" | "private" | "semi_private";
  source: string;
  sourceUrl: string;
  thumbnailUrl: string;
  outputType: string;
  durationLabel: string;
  aspectRatio: "landscape" | "portrait";
  publicSlug: string;
  createdAt: string;
  authorName: string;
  authorUsername: string;
  authorEmail: string;
};

export type AdminNotificationScheduleItem = {
  id: string;
  targetType: "all" | "active" | "blocked" | "public" | "private";
  targetUser: { name: string; email: string; username: string } | null;
  title: string;
  message: string;
  status: "draft" | "scheduled" | "sent" | "paused" | "cancelled";
  sendMode: "now" | "scheduled";
  recurrence: "once" | "daily" | "weekly" | "monthly";
  startsAt: string;
  endsAt: string | null;
  nextRunAt: string | null;
  lastSentAt: string | null;
  activeDurationDays: number;
};

type DatabaseStorageInfo = {
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  usedPercent: number;
  status: "ok" | "warning" | "danger";
};

type AdminPanelClientProps = {
  stats: {
    totalUsers: number;
    totalVideos: number;
    publicVideos: number;
    semiPrivateVideos: number;
    draftVideos: number;
    privateVideos: number;
    visitorToday: number;
    visitorYesterday: number;
    visitorLast7Days: number;
    scheduledNotifications: number;
    activeCampaigns: number;
  };
  dbHealth: {
    ok: boolean;
    message: string;
    latencyMs?: number;
    storage?: DatabaseStorageInfo | null;
  };
  analytics: AdminAnalyticsOverview;
  settings: {
    maintenanceEnabled: boolean;
    pauseEnabled: boolean;
    maintenanceMessage: string;
  };
  users: AdminUserItem[];
  videos: AdminVideoItem[];
  schedules: AdminNotificationScheduleItem[];
  filters: { search: string; platform: string; status: string; sort: string; page: number };
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
  ownerProfile: { username: string; email: string };
};

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: value >= 10 ? 0 : 1 }).format(value)} ${units[unitIndex]}`;
}

async function parseApiError(response: Response) {
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  return payload?.error || "Aksi belum berhasil diproses.";
}

function Sparkline({ tone = "emerald" }: { tone?: "emerald" | "amber" | "blue" }) {
  const stroke = tone === "amber" ? "#f59e0b" : tone === "blue" ? "#2563eb" : "#10b981";
  return (
    <svg viewBox="0 0 120 42" preserveAspectRatio="none" className="h-12 w-28">
      <path d="M3 35 C18 27 24 29 36 22 C50 14 61 20 74 12 C88 4 99 10 117 3" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function SummaryCard({ icon: Icon, label, value, delta, tone = "emerald" }: { icon: typeof Users; label: string; value: string; delta: string; tone?: "emerald" | "amber" | "blue" }) {
  const toneClass = tone === "amber" ? "bg-amber-50 text-amber-700" : tone === "blue" ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700";
  return (
    <Card className="overflow-hidden border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
      <div className="flex items-start justify-between gap-3">
        <span className={cn("inline-flex h-11 w-11 items-center justify-center rounded-2xl", toneClass)}><Icon className="h-5 w-5" /></span>
        <Sparkline tone={tone} />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="font-display text-3xl font-semibold text-slate-950">{value}</p>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", toneClass)}>{delta}</span>
      </div>
    </Card>
  );
}

function platformClass(source: string) {
  const value = source.toLowerCase();
  if (value.includes("instagram")) return "bg-pink-50 text-pink-700 ring-pink-200";
  if (value.includes("facebook")) return "bg-blue-50 text-blue-700 ring-blue-200";
  if (value.includes("youtube")) return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

export function AdminPanelClient({ stats, analytics, dbHealth, settings, users, videos, schedules, filters, pagination, ownerProfile }: AdminPanelClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [health, setHealth] = useState(dbHealth);
  const [settingsState, setSettingsState] = useState(settings);
  const [notificationTitle, setNotificationTitle] = useState("Update Showcase Terbaru");
  const [notificationMessage, setNotificationMessage] = useState("Ada update showcase baru yang siap ditampilkan ke audiens Anda.");
  const [sendMode, setSendMode] = useState("now");

  const refresh = () => startTransition(() => router.refresh());

  const ownerOptions = useMemo(() => users.slice(0, 30), [users]);
  const firstItem = Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.totalItems || 0);
  const lastItem = Math.min(pagination.page * pagination.pageSize, pagination.totalItems);

  const pushQuery = (patch: Record<string, string | number>) => {
    const params = new URLSearchParams();
    const next = { ...filters, ...patch };
    if (next.search) params.set("search", String(next.search));
    if (next.platform && next.platform !== "all") params.set("platform", String(next.platform));
    if (next.status && next.status !== "all") params.set("status", String(next.status));
    if (next.sort && next.sort !== "newest") params.set("sort", String(next.sort));
    if (Number(next.page) > 1) params.set("page", String(next.page));
    router.push(`/admin${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const onFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    pushQuery({ search: String(formData.get("search") || ""), sort: String(formData.get("sort") || "newest"), page: 1 });
  };

  const refreshHealth = async () => {
    const response = await fetch("/api/admin/health", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as { ok?: boolean; latencyMs?: number; error?: string; storage?: DatabaseStorageInfo | null } | null;
    setHealth({ ok: Boolean(payload?.ok), latencyMs: payload?.latencyMs, storage: payload?.storage ?? null, message: payload?.ok ? `Database sehat (${payload.latencyMs ?? 0}ms)` : payload?.error || "Database tidak merespons." });
  };

  const updateSettings = async () => {
    const confirmed = await confirmFeedbackAction({ title: "Simpan pengaturan website?", text: "Mode maintenance/pause akan langsung memengaruhi akses pengunjung.", confirmButtonText: "Simpan" });
    if (!confirmed) return;
    const response = await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settingsState) });
    if (!response.ok) {
      await showFeedbackAlert({ title: "Pengaturan gagal disimpan", text: await parseApiError(response), icon: "error" });
      return;
    }
    await showFeedbackAlert({ title: "Pengaturan tersimpan", icon: "success", timer: 900 });
    refresh();
  };

  const updateVideo = async (event: FormEvent<HTMLFormElement>, videoId: string) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const confirmed = await confirmFeedbackAction({ title: "Simpan perubahan video?", text: "Metadata video akan langsung berubah di halaman publik.", confirmButtonText: "Simpan" });
    if (!confirmed) return;
    const response = await fetch(`/api/admin/videos/${videoId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: formData.get("title"), description: formData.get("description"), visibility: formData.get("visibility"), sourceUrl: formData.get("sourceUrl"), thumbnailUrl: formData.get("thumbnailUrl"), outputType: formData.get("outputType"), durationLabel: formData.get("durationLabel"), aspectRatio: formData.get("aspectRatio") }) });
    if (!response.ok) {
      await showFeedbackAlert({ title: "Video gagal diperbarui", text: await parseApiError(response), icon: "error" });
      return;
    }
    await showFeedbackAlert({ title: "Video diperbarui", icon: "success", timer: 900 });
    refresh();
  };

  const deleteVideo = async (video: AdminVideoItem) => {
    const confirmed = await confirmFeedbackAction({ title: `Hapus video "${video.title}"?`, text: "Postingan ini akan dihapus permanen dari database.", confirmButtonText: "Hapus video", icon: "warning" });
    if (!confirmed) return;
    const response = await fetch(`/api/admin/videos/${video.id}`, { method: "DELETE" });
    if (!response.ok) {
      await showFeedbackAlert({ title: "Video gagal dihapus", text: await parseApiError(response), icon: "error" });
      return;
    }
    await showFeedbackAlert({ title: "Video dihapus", icon: "success", timer: 900 });
    refresh();
  };

  const sendNotification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const startsAtRaw = String(formData.get("startsAt") || "");
    const endsAtRaw = String(formData.get("endsAt") || "");
    const response = await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: formData.get("targetType"),
        targetUserId: formData.get("targetUserId") || null,
        title: notificationTitle,
        message: notificationMessage,
        sendMode: formData.get("sendMode"),
        recurrence: formData.get("recurrence"),
        startsAt: startsAtRaw ? new Date(startsAtRaw).toISOString() : null,
        endsAt: endsAtRaw ? new Date(endsAtRaw).toISOString() : null,
        activeDurationDays: formData.get("activeDurationDays"),
      }),
    });
    if (!response.ok) {
      await showFeedbackAlert({ title: "Notifikasi gagal dikirim", text: await parseApiError(response), icon: "error" });
      return;
    }
    await showFeedbackAlert({ title: sendMode === "now" ? "Notifikasi dikirim" : "Notifikasi dijadwalkan", text: notificationTitle, icon: "success", timer: 1200 });
    refresh();
  };

  return (
    <div className="space-y-6 bg-white text-slate-950">
      <Card className="border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500"><span>Dashboard</span><span>/</span><span className="text-slate-950">Users Management</span></div>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-slate-950">Users Management</h1>
            <p className="mt-2 text-sm text-slate-600">Kelola semua user dan showcase videos</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">OV</div>
            <div><p className="text-sm font-semibold text-slate-950">@{ownerProfile.username}</p><p className="text-xs text-slate-500">{ownerProfile.email}</p></div>
          </div>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Users} label="Total Users" value={formatNumber(stats.totalUsers)} delta="+12%" />
        <SummaryCard icon={PlayCircle} label="Total Showcase" value={formatNumber(stats.totalVideos)} delta="+8%" />
        <SummaryCard icon={Clock3} label="Scheduled Notifications" value={formatNumber(stats.scheduledNotifications)} delta="+3" tone="amber" />
        <SummaryCard icon={Megaphone} label="Active Campaigns" value={formatNumber(stats.activeCampaigns)} delta="+2" tone="blue" />
      </section>

      <Card className="border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
        <form onSubmit={onFilterSubmit} className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input name="search" defaultValue={filters.search} placeholder="Cari user/video berdasarkan nama, email, judul, atau slug" className="pl-9" /></div>
          <Select name="sort" defaultValue={filters.sort} className="xl:w-44"><option value="newest">Terbaru</option><option value="oldest">Terlama</option><option value="az">A-Z</option><option value="za">Z-A</option></Select>
          <Button type="submit" className="xl:w-auto"><Search className="h-4 w-4" />Terapkan</Button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {["all", "instagram", "facebook", "youtube"].map((item) => <button key={item} type="button" onClick={() => pushQuery({ platform: item, page: 1 })} className={cn("rounded-full border px-3 py-1.5 text-sm font-semibold capitalize transition", filters.platform === item ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")}>{item === "all" ? "All Platform" : item}</button>)}
          {["all", "public", "private"].map((item) => <button key={item} type="button" onClick={() => pushQuery({ status: item, page: 1 })} className={cn("rounded-full border px-3 py-1.5 text-sm font-semibold capitalize transition", filters.status === item ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")}>{item === "all" ? "All Status" : item}</button>)}
        </div>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {videos.map((video) => (
              <Card key={video.id} className="group border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><h3 className="truncate text-base font-semibold text-slate-950">{video.title}</h3><p className="mt-1 truncate text-sm text-slate-600">{video.authorName} · {video.authorEmail}</p></div>
                  <Badge className={cn("capitalize ring-1", platformClass(video.source))}>{video.source}</Badge>
                </div>
                <p className="mt-3 truncate rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">/v/{video.publicSlug}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500"><span>{formatShortDate(video.createdAt)}</span><Badge className={video.visibility === "public" ? "bg-emerald-600" : "bg-slate-800"}>{video.visibility === "public" ? "Public" : "Private"}</Badge></div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <a href={`/v/${video.publicSlug}`} target="_blank" className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"><Eye className="h-4 w-4" />View</a>
                  <details className="contents"><summary className="inline-flex h-9 cursor-pointer list-none items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"><Edit3 className="h-4 w-4" />Edit</summary><form onSubmit={(event) => updateVideo(event, video.id)} className="col-span-3 mt-3 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3"><Input name="title" defaultValue={video.title} /><Textarea name="description" defaultValue={video.description} /><Select name="visibility" defaultValue={video.visibility}><option value="public">Public</option><option value="semi_private">Semi Private</option><option value="draft">Draft</option><option value="private">Private</option></Select><Select name="aspectRatio" defaultValue={video.aspectRatio}><option value="landscape">Landscape</option><option value="portrait">Portrait</option></Select><Input name="sourceUrl" defaultValue={video.sourceUrl} /><Input name="thumbnailUrl" defaultValue={video.thumbnailUrl} /><Input name="outputType" defaultValue={video.outputType} /><Input name="durationLabel" defaultValue={video.durationLabel} /><Button type="submit" size="sm">Simpan</Button></form></details>
                  <Button variant="danger" size="sm" onClick={() => void deleteVideo(video)}><Trash2 className="h-4 w-4" />Hapus</Button>
                </div>
              </Card>
            ))}
          </div>
          {!videos.length ? <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Tidak ada showcase yang cocok dengan filter.</p> : null}
          <Card className="flex flex-col gap-3 border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">Menampilkan <strong className="text-slate-950">{firstItem}-{lastItem}</strong> dari <strong className="text-slate-950">{formatNumber(pagination.totalItems)}</strong> data</p>
            <div className="flex flex-wrap gap-2">{[1, 2, 3].filter((item) => item <= pagination.totalPages).map((item) => <Button key={item} size="sm" variant={pagination.page === item ? "primary" : "secondary"} onClick={() => pushQuery({ page: item })}>{item}</Button>)}{pagination.totalPages > 3 ? <span className="px-2 py-1 text-sm text-slate-500">...</span> : null}{pagination.totalPages > 3 ? <Button size="sm" variant="secondary" onClick={() => pushQuery({ page: pagination.totalPages })}>{pagination.totalPages}</Button> : null}</div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/5">
            <div className="flex items-center gap-2"><Bell className="h-5 w-5 text-slate-950" /><h2 className="font-display text-2xl font-semibold text-slate-950">Kirim Notifikasi</h2></div>
            <form onSubmit={sendNotification} className="mt-4 space-y-3">
              <Select name="targetType" defaultValue="all"><option value="all">Semua user</option><option value="active">User aktif</option><option value="blocked">User diblokir</option><option value="public">Profile public</option><option value="private">Profile private</option></Select>
              <Select name="targetUserId" defaultValue=""><option value="">Tidak pilih user spesifik</option>{ownerOptions.map((user) => <option key={user.id} value={user.id}>{user.name || user.email} — {user.email}</option>)}</Select>
              <Input value={notificationTitle} onChange={(event) => setNotificationTitle(event.target.value)} placeholder="Contoh: Update Showcase Terbaru" />
              <Textarea value={notificationMessage} onChange={(event) => setNotificationMessage(event.target.value)} placeholder="Isi pesan notifikasi" className="min-h-28" />
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Preview Sweet Alert</p><div className="mt-3 rounded-2xl bg-white p-4 text-center shadow-sm"><Sparkles className="mx-auto h-8 w-8 text-slate-950" /><p className="mt-2 font-semibold text-slate-950">{notificationTitle || "Judul notifikasi"}</p><p className="mt-1 text-sm text-slate-600">{notificationMessage || "Isi pesan akan tampil di sini."}</p></div></div>
              <div className="grid gap-2 sm:grid-cols-2"><Select name="sendMode" value={sendMode} onChange={(event) => setSendMode(event.target.value)}><option value="now">Kirim sekarang</option><option value="scheduled">Terjadwal</option></Select><Select name="recurrence" defaultValue="once"><option value="once">Sekali</option><option value="daily">Harian</option><option value="weekly">Mingguan</option><option value="monthly">Bulanan</option></Select></div>
              <div className="grid gap-2 sm:grid-cols-2"><Input name="startsAt" type="datetime-local" disabled={sendMode === "now"} /><Input name="endsAt" type="datetime-local" /></div>
              <Input name="activeDurationDays" type="number" min={1} max={365} defaultValue={7} placeholder="Durasi aktif hari" />
              <Button type="submit" className="w-full"><Bell className="h-4 w-4" />Kirim Notifikasi</Button>
            </form>
          </Card>

          <Card className="border-slate-200 bg-white p-5"><h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Campaign terjadwal</h3><div className="mt-3 space-y-2">{schedules.map((item) => <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold text-slate-950">{item.title}</p><Badge className="bg-slate-950 capitalize">{item.status}</Badge></div><p className="mt-1 line-clamp-2 text-xs text-slate-600">{item.message}</p><p className="mt-2 text-xs text-slate-500">Next: {formatDateTime(item.nextRunAt)} · {item.recurrence}</p></div>)}{!schedules.length ? <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">Belum ada campaign.</p> : null}</div></Card>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="border-slate-200 bg-white p-5"><p className="text-sm font-semibold text-slate-950">Status database</p><p className={cn("mt-1 text-sm", health.ok ? "text-emerald-700" : "text-rose-700")}>{health.message}</p><Button variant="secondary" size="sm" className="mt-3" onClick={refreshHealth}><Database className="h-4 w-4" />Refresh database</Button>{health.storage ? <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3"><div className="flex items-center gap-2 text-sm font-semibold text-slate-950"><HardDrive className="h-4 w-4" />{health.storage.usedPercent.toFixed(1)}% terpakai</div><p className="mt-1 text-xs text-slate-500">{formatBytes(health.storage.usedBytes)} / {formatBytes(health.storage.limitBytes)}</p></div> : null}</Card>
        <Card className="border-slate-200 bg-white p-5 xl:col-span-2"><div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Website control</p><h2 className="mt-1 font-display text-2xl font-semibold text-slate-950">Maintenance dan pause sementara</h2></div>{isPending ? <Loader2 className="h-5 w-5 animate-spin text-slate-600" /> : null}</div><div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]"><div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"><label className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-900">Maintenance mode<input type="checkbox" checked={settingsState.maintenanceEnabled} onChange={(event) => setSettingsState((prev) => ({ ...prev, maintenanceEnabled: event.target.checked }))} className="h-5 w-5 accent-slate-950" /></label><label className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-900">Pause website sementara<input type="checkbox" checked={settingsState.pauseEnabled} onChange={(event) => setSettingsState((prev) => ({ ...prev, pauseEnabled: event.target.checked }))} className="h-5 w-5 accent-slate-950" /></label></div><div className="space-y-3"><Textarea value={settingsState.maintenanceMessage} onChange={(event) => setSettingsState((prev) => ({ ...prev, maintenanceMessage: event.target.value }))} placeholder="Pesan maintenance untuk pengunjung" className="min-h-24" /><Button onClick={updateSettings}><Settings2 className="h-4 w-4" />Simpan pengaturan</Button></div></div></Card>
      </section>

      <Card className="border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><Film className="h-5 w-5" /><h2 className="font-display text-2xl font-semibold text-slate-950">Analytics ringkas</h2></div><div className="mt-4 grid gap-3 md:grid-cols-4"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Klik 30 hari</p><p className="text-2xl font-semibold text-slate-950">{formatNumber(analytics.engagement.clicks)}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Video views</p><p className="text-2xl font-semibold text-slate-950">{formatNumber(analytics.engagement.videoViews)}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Shares</p><p className="text-2xl font-semibold text-slate-950">{formatNumber(analytics.engagement.shares)}</p></div><div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Likes</p><p className="text-2xl font-semibold text-slate-950">{formatNumber(analytics.engagement.likes)}</p></div></div></Card>
    </div>
  );
}
