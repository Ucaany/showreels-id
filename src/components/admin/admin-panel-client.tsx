"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  CalendarDays,
  Database,
  Film,
  HardDrive,
  Link2,
  Loader2,
  PauseCircle,
  Search,
  Settings2,
  ShieldCheck,
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
import {
  confirmFeedbackAction,
  showFeedbackAlert,
} from "@/lib/feedback-alert";

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
  };
  dbHealth: {
    ok: boolean;
    message: string;
    latencyMs?: number;
    storage?: DatabaseStorageInfo | null;
  };
  settings: {
    maintenanceEnabled: boolean;
    pauseEnabled: boolean;
    maintenanceMessage: string;
  };
  users: AdminUserItem[];
  videos: AdminVideoItem[];
  userSearch: string;
  videoSearch: string;
};

type DatabaseStorageInfo = {
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  usedPercent: number;
  status: "ok" | "warning" | "danger";
};

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function useQueryUpdater() {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (key: "userSearch" | "videoSearch", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set(key, value.trim());
    } else {
      params.delete(key);
    }
    router.push(`/admin?${params.toString()}`);
  };
}

async function parseApiError(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  return payload?.error || "Aksi belum berhasil diproses.";
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone = "brand",
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  tone?: "brand" | "emerald" | "amber" | "rose";
}) {
  const toneClass = {
    brand: "bg-brand-100 text-brand-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
  }[tone];

  return (
    <Card className="border-slate-200 bg-white p-4">
      <div className={cn("inline-flex h-10 w-10 items-center justify-center rounded-2xl", toneClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm text-slate-600">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold text-slate-950">
        {value}
      </p>
    </Card>
  );
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

  const maximumFractionDigits = value >= 10 || unitIndex === 0 ? 0 : 1;

  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits,
  }).format(value)} ${units[unitIndex]}`;
}

function DatabaseStoragePreview({
  storage,
}: {
  storage?: DatabaseStorageInfo | null;
}) {
  const storageTone = storage?.status || "ok";
  const toneClass = {
    ok: {
      text: "text-emerald-700",
      icon: "bg-emerald-100 text-emerald-700",
      bar: "bg-emerald-500",
    },
    warning: {
      text: "text-amber-700",
      icon: "bg-amber-100 text-amber-700",
      bar: "bg-amber-500",
    },
    danger: {
      text: "text-rose-700",
      icon: "bg-rose-100 text-rose-700",
      bar: "bg-rose-500",
    },
  }[storageTone];

  if (!storage) {
    return (
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <HardDrive className="h-4 w-4 text-slate-500" />
          Database storage
        </div>
        <p className="mt-2 text-sm text-slate-500">Data storage belum tersedia.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-950">Database storage</p>
          <p className={cn("mt-1 text-sm font-medium", toneClass.text)}>
            {storage.usedPercent.toFixed(1)}% terpakai
          </p>
        </div>
        <span
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-xl",
            toneClass.icon
          )}
        >
          <HardDrive className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full", toneClass.bar)}
          style={{ width: `${Math.min(Math.max(storage.usedPercent, 0), 100)}%` }}
        />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-slate-500">Terpakai</p>
          <p className="font-semibold text-slate-950">{formatBytes(storage.usedBytes)}</p>
        </div>
        <div>
          <p className="text-slate-500">Sisa</p>
          <p className="font-semibold text-slate-950">{formatBytes(storage.remainingBytes)}</p>
        </div>
        <div>
          <p className="text-slate-500">Limit</p>
          <p className="font-semibold text-slate-950">{formatBytes(storage.limitBytes)}</p>
        </div>
      </div>
    </div>
  );
}

export function AdminPanelClient({
  stats,
  dbHealth,
  settings,
  users,
  videos,
  userSearch,
  videoSearch,
}: AdminPanelClientProps) {
  const router = useRouter();
  const updateQuery = useQueryUpdater();
  const [isPending, startTransition] = useTransition();
  const [health, setHealth] = useState(dbHealth);
  const [settingsState, setSettingsState] = useState(settings);

  const refresh = () => startTransition(() => router.refresh());

  const onSearch =
    (key: "userSearch" | "videoSearch") => (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      updateQuery(key, String(formData.get(key) || ""));
    };

  const updateSettings = async () => {
    const confirmed = await confirmFeedbackAction({
      title: "Simpan pengaturan website?",
      text: "Mode maintenance/pause akan langsung memengaruhi akses pengunjung.",
      confirmButtonText: "Simpan",
    });

    if (!confirmed) return;

    const response = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settingsState),
    });

    if (!response.ok) {
      await showFeedbackAlert({
        title: "Pengaturan gagal disimpan",
        text: await parseApiError(response),
        icon: "error",
      });
      return;
    }

    await showFeedbackAlert({
      title: "Pengaturan tersimpan",
      icon: "success",
      timer: 900,
    });
    refresh();
  };

  const refreshHealth = async () => {
    const response = await fetch("/api/admin/health", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as
      | {
          ok?: boolean;
          latencyMs?: number;
          error?: string;
          storage?: DatabaseStorageInfo | null;
        }
      | null;

    setHealth({
      ok: Boolean(payload?.ok),
      latencyMs: payload?.latencyMs,
      storage: payload?.storage ?? null,
      message: payload?.ok
        ? `Database sehat (${payload.latencyMs ?? 0}ms)`
        : payload?.error || "Database tidak merespons.",
    });
  };

  const updateUser = async (event: FormEvent<HTMLFormElement>, userId: string) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const isBlocked = formData.get("isBlocked") === "on";

    const confirmed = await confirmFeedbackAction({
      title: "Simpan perubahan user?",
      text: isBlocked
        ? "User yang diblokir tidak dapat login sampai dibuka lagi."
        : "Perubahan akan tersimpan ke database.",
      confirmButtonText: "Simpan",
    });
    if (!confirmed) return;

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        username: formData.get("username"),
        role: formData.get("role"),
        bio: formData.get("bio"),
        city: formData.get("city"),
        contactEmail: formData.get("contactEmail"),
        phoneNumber: formData.get("phoneNumber"),
        websiteUrl: formData.get("websiteUrl"),
        isBlocked,
        blockedReason: formData.get("blockedReason"),
      }),
    });

    if (!response.ok) {
      await showFeedbackAlert({
        title: "User gagal diperbarui",
        text: await parseApiError(response),
        icon: "error",
      });
      return;
    }

    await showFeedbackAlert({ title: "User diperbarui", icon: "success", timer: 900 });
    refresh();
  };

  const deleteUser = async (user: AdminUserItem) => {
    const confirmed = await confirmFeedbackAction({
      title: `Hapus akun ${user.name || user.email}?`,
      text: "Akun, session, account auth, dan video milik user ini akan ikut terhapus.",
      confirmButtonText: "Hapus akun",
      icon: "warning",
    });
    if (!confirmed) return;

    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      await showFeedbackAlert({
        title: "Akun gagal dihapus",
        text: await parseApiError(response),
        icon: "error",
      });
      return;
    }

    await showFeedbackAlert({ title: "Akun dihapus", icon: "success", timer: 900 });
    refresh();
  };

  const updateVideo = async (event: FormEvent<HTMLFormElement>, videoId: string) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const confirmed = await confirmFeedbackAction({
      title: "Simpan perubahan video?",
      text: "Metadata video akan langsung berubah di halaman publik.",
      confirmButtonText: "Simpan",
    });
    if (!confirmed) return;

    const response = await fetch(`/api/admin/videos/${videoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        description: formData.get("description"),
        visibility: formData.get("visibility"),
        sourceUrl: formData.get("sourceUrl"),
        thumbnailUrl: formData.get("thumbnailUrl"),
        outputType: formData.get("outputType"),
        durationLabel: formData.get("durationLabel"),
        aspectRatio: formData.get("aspectRatio"),
      }),
    });

    if (!response.ok) {
      await showFeedbackAlert({
        title: "Video gagal diperbarui",
        text: await parseApiError(response),
        icon: "error",
      });
      return;
    }

    await showFeedbackAlert({ title: "Video diperbarui", icon: "success", timer: 900 });
    refresh();
  };

  const deleteVideo = async (video: AdminVideoItem) => {
    const confirmed = await confirmFeedbackAction({
      title: `Hapus video "${video.title}"?`,
      text: "Postingan ini akan dihapus permanen dari database.",
      confirmButtonText: "Hapus video",
      icon: "warning",
    });
    if (!confirmed) return;

    const response = await fetch(`/api/admin/videos/${video.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      await showFeedbackAlert({
        title: "Video gagal dihapus",
        text: await parseApiError(response),
        icon: "error",
      });
      return;
    }

    await showFeedbackAlert({ title: "Video dihapus", icon: "success", timer: 900 });
    refresh();
  };

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-slate-200 bg-white p-0">
        <div className="grid gap-5 p-5 lg:grid-cols-[1.4fr_0.9fr]">
          <div>
            <Badge className="bg-slate-950 text-white">Owner only</Badge>
            <h1 className="mt-4 font-display text-3xl font-semibold text-slate-950">
              Admin Control Center
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Pantau creator, video, visitor, status database, dan kontrol
              maintenance dari satu dashboard private yang tersinkron langsung ke
              database.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">Status database</p>
                <p className={cn("text-sm", health.ok ? "text-emerald-700" : "text-rose-700")}>
                  {health.message}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center rounded-2xl",
                  health.ok ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                )}
              >
                {health.ok ? <CheckCircle2 className="h-5 w-5" /> : <Database className="h-5 w-5" />}
              </span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4 w-full"
              onClick={refreshHealth}
            >
              <Database className="h-4 w-4" />
              Refresh status database
            </Button>
            <DatabaseStoragePreview storage={health.storage} />
          </div>
        </div>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        <StatCard icon={Users} label="Total pengguna" value={stats.totalUsers} />
        <StatCard icon={Film} label="Total video" value={stats.totalVideos} />
        <StatCard icon={CheckCircle2} label="Public" value={stats.publicVideos} tone="emerald" />
        <StatCard
          icon={Link2}
          label="Semi Private"
          value={stats.semiPrivateVideos}
          tone="brand"
        />
        <StatCard icon={PauseCircle} label="Draft" value={stats.draftVideos} tone="amber" />
        <StatCard icon={ShieldCheck} label="Visitor hari ini" value={stats.visitorToday} />
        <StatCard
          icon={CalendarDays}
          label="Visitor kemarin"
          value={stats.visitorYesterday}
          tone="amber"
        />
        <StatCard
          icon={CalendarDays}
          label="Visitor 7 hari"
          value={stats.visitorLast7Days}
          tone="emerald"
        />
      </section>

      <Card className="border-slate-200 bg-white">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
              Website control
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-slate-950">
              Maintenance dan pause sementara
            </h2>
          </div>
          {isPending ? <Loader2 className="h-5 w-5 animate-spin text-brand-600" /> : null}
        </div>
        <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-900">
              Maintenance mode
              <input
                type="checkbox"
                checked={settingsState.maintenanceEnabled}
                onChange={(event) =>
                  setSettingsState((prev) => ({
                    ...prev,
                    maintenanceEnabled: event.target.checked,
                  }))
                }
                className="h-5 w-5 accent-brand-600"
              />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-900">
              Pause website sementara
              <input
                type="checkbox"
                checked={settingsState.pauseEnabled}
                onChange={(event) =>
                  setSettingsState((prev) => ({
                    ...prev,
                    pauseEnabled: event.target.checked,
                  }))
                }
                className="h-5 w-5 accent-brand-600"
              />
            </label>
          </div>
          <div className="space-y-3">
            <Textarea
              value={settingsState.maintenanceMessage}
              onChange={(event) =>
                setSettingsState((prev) => ({
                  ...prev,
                  maintenanceMessage: event.target.value,
                }))
              }
              placeholder="Pesan maintenance untuk pengunjung"
              className="min-h-24"
            />
            <Button onClick={updateSettings} className="w-full sm:w-auto">
              <Settings2 className="h-4 w-4" />
              Simpan pengaturan
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-slate-200 bg-white">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
              User management
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-slate-950">
              Pengguna creator
            </h2>
          </div>
          <form onSubmit={onSearch("userSearch")} className="flex gap-2">
            <Input
              name="userSearch"
              defaultValue={userSearch}
              placeholder="Cari nama, username, email, kota"
              className="min-w-0 sm:min-w-[320px]"
            />
            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4" />
              Cari
            </Button>
          </form>
        </div>
        <div className="space-y-3">
          {users.map((user) => (
            <details key={user.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{user.name || "Creator"}</p>
                      {user.isBlocked ? (
                        <Badge className="bg-rose-600">Blocked</Badge>
                      ) : (
                        <Badge className="bg-emerald-600">Active</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      @{user.username || "-"} · {user.email}
                    </p>
                    <p className="text-xs text-slate-500">
                      {user.city || "Kota belum diisi"} · {user.videoCount} video · Bergabung{" "}
                      {formatShortDate(user.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(event) => {
                        event.preventDefault();
                        void deleteUser(user);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus
                    </Button>
                  </div>
                </div>
              </summary>
              <form onSubmit={(event) => updateUser(event, user.id)} className="mt-4 grid gap-3 lg:grid-cols-2">
                <Input name="name" defaultValue={user.name} placeholder="Nama" />
                <Input name="username" defaultValue={user.username} placeholder="Username" />
                <Input name="role" defaultValue={user.role} placeholder="Role" />
                <Input name="city" defaultValue={user.city} placeholder="Kota" />
                <Input name="contactEmail" defaultValue={user.contactEmail} placeholder="Email kontak" />
                <Input name="phoneNumber" defaultValue={user.phoneNumber} placeholder="Telepon" />
                <Input name="websiteUrl" defaultValue={user.websiteUrl} placeholder="Website" className="lg:col-span-2" />
                <Textarea name="bio" defaultValue={user.bio} placeholder="Bio" className="lg:col-span-2" />
                <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900">
                  <input
                    name="isBlocked"
                    type="checkbox"
                    defaultChecked={user.isBlocked}
                    className="h-4 w-4 accent-brand-600"
                  />
                  Blokir user
                </label>
                <Input
                  name="blockedReason"
                  defaultValue={user.blockedReason}
                  placeholder="Alasan blokir (opsional)"
                />
                <div className="lg:col-span-2">
                  <Button type="submit">Simpan user</Button>
                </div>
              </form>
            </details>
          ))}
          {!users.length ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Tidak ada user yang cocok dengan pencarian.
            </p>
          ) : null}
        </div>
      </Card>

      <Card className="border-slate-200 bg-white">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
              Video management
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-slate-950">
              Postingan video
            </h2>
          </div>
          <form onSubmit={onSearch("videoSearch")} className="flex gap-2">
            <Input
              name="videoSearch"
              defaultValue={videoSearch}
              placeholder="Cari judul, slug, source, author"
              className="min-w-0 sm:min-w-[320px]"
            />
            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4" />
              Cari
            </Button>
          </form>
        </div>
        <div className="space-y-3">
          {videos.map((video) => (
            <details key={video.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <summary className="cursor-pointer list-none">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-950">{video.title}</p>
                      <Badge
                        className={cn(
                          video.visibility === "public" && "bg-emerald-600",
                          video.visibility === "semi_private" && "bg-blue-600",
                          video.visibility === "draft" && "bg-amber-600",
                          video.visibility === "private" && "bg-slate-700"
                        )}
                      >
                        {video.visibility}
                      </Badge>
                      <Badge className="bg-slate-950">{video.source}</Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      @{video.authorUsername || "-"} · {video.authorEmail}
                    </p>
                    <p className="text-xs text-slate-500">
                      /v/{video.publicSlug} · {formatShortDate(video.createdAt)}
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={(event) => {
                      event.preventDefault();
                      void deleteVideo(video);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </Button>
                </div>
              </summary>
              <form onSubmit={(event) => updateVideo(event, video.id)} className="mt-4 grid gap-3 lg:grid-cols-2">
                <Input name="title" defaultValue={video.title} placeholder="Judul" className="lg:col-span-2" />
                <Textarea name="description" defaultValue={video.description} placeholder="Deskripsi" className="lg:col-span-2" />
                <Select name="visibility" defaultValue={video.visibility}>
                  <option value="public">Public</option>
                  <option value="semi_private">Semi Private</option>
                  <option value="draft">Draft</option>
                  <option value="private">Private</option>
                </Select>
                <Select name="aspectRatio" defaultValue={video.aspectRatio}>
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                </Select>
                <Input name="sourceUrl" defaultValue={video.sourceUrl} placeholder="URL sumber" className="lg:col-span-2" />
                <Input name="thumbnailUrl" defaultValue={video.thumbnailUrl} placeholder="Thumbnail URL" className="lg:col-span-2" />
                <Input name="outputType" defaultValue={video.outputType} placeholder="Output type" />
                <Input name="durationLabel" defaultValue={video.durationLabel} placeholder="Durasi" />
                <div className="lg:col-span-2">
                  <Button type="submit">Simpan video</Button>
                </div>
              </form>
            </details>
          ))}
          {!videos.length ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Tidak ada video yang cocok dengan pencarian.
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
