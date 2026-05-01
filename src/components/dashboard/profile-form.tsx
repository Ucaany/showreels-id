"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import {
  ChevronDown,
  Crop,
  ImageIcon,
  Link2,
  List,
  Pilcrow,
  Sparkles,
  Tag,
  Trash2,
  UserCircle,
  UserRoundPen,
} from "lucide-react";
import { AvatarBadge } from "@/components/avatar-badge";
import { ImageCropDialog } from "@/components/dashboard/image-crop-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePreferences } from "@/hooks/use-preferences";
import type { DbUser } from "@/db/schema";
import { normalizeAvatarUrl } from "@/lib/avatar-utils";
import { getBackgroundImageCropStyle, normalizeImageCrop } from "@/lib/image-crop";
import { getAgeFromBirthDate } from "@/lib/profile-utils";
import { isReservedUsername, USERNAME_REGEX } from "@/lib/username-rules";

/* ── Schema ── */

const schema = z.object({
  fullName: z.string().min(2, "Nama minimal 2 karakter."),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter.")
    .max(30, "Username maksimal 30 karakter.")
    .regex(USERNAME_REGEX, "Gunakan huruf kecil, angka, underscore, atau dash.")
    .refine((value) => !isReservedUsername(value), {
      message: "Username tidak dapat digunakan.",
    }),
  role: z.string().max(120, "Role terlalu panjang."),
  avatarUrl: z
    .string()
    .max(1200, "URL avatar terlalu panjang.")
    .refine((value) => !String(value || "").toLowerCase().startsWith("data:"), {
      message: "Gunakan URL avatar, bukan file langsung.",
    })
    .refine((value) => value === "" || normalizeAvatarUrl(value).startsWith("http"), {
      message: "Gunakan URL http/https yang valid.",
    }),
  coverImageUrl: z
    .string()
    .max(1200, "URL cover terlalu panjang.")
    .refine((value) => !String(value || "").toLowerCase().startsWith("data:"), {
      message: "Gunakan URL cover, bukan file langsung.",
    })
    .refine((value) => value === "" || normalizeAvatarUrl(value).startsWith("http"), {
      message: "Gunakan URL http/https yang valid.",
    }),
  bio: z.string().max(240, "Bio maksimal 240 karakter."),
  experience: z.string().max(700, "Pengalaman maksimal 700 karakter."),
  birthDate: z.string().optional(),
  city: z.string().max(120, "Kota terlalu panjang."),
  skills: z.string().max(300, "Skills terlalu panjang."),
  avatarCropX: z.number().min(-100).max(100),
  avatarCropY: z.number().min(-100).max(100),
  avatarCropZoom: z.number().min(100).max(300),
  coverCropX: z.number().min(-100).max(100),
  coverCropY: z.number().min(-100).max(100),
  coverCropZoom: z.number().min(100).max(300),
});

type FormValues = z.infer<typeof schema>;

const USERNAME_WINDOW_DAYS = 30;
const USERNAME_MAX_CHANGES = 3;

function getUsernameQuota(user: DbUser, nextUsername: string) {
  const originalUsername = user.username || "";
  const normalizedNext = nextUsername.trim();

  if (!normalizedNext || normalizedNext === originalUsername) {
    const used = user.usernameChangeCount || 0;
    return {
      remaining: Math.max(0, USERNAME_MAX_CHANGES - used),
      used,
      resetLabel: user.usernameChangeWindowStart
        ? new Date(
            user.usernameChangeWindowStart.getTime() +
              USERNAME_WINDOW_DAYS * 24 * 60 * 60 * 1000
          ).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
        : null,
      willConsume: false,
    };
  }

  const windowStart = user.usernameChangeWindowStart;
  if (!windowStart) {
    return { remaining: USERNAME_MAX_CHANGES - 1, used: 0, resetLabel: null, willConsume: true };
  }

  const now = Date.now();
  const resetAt = windowStart.getTime() + USERNAME_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const resetLabel = new Date(resetAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });

  if (now >= resetAt) {
    return { remaining: USERNAME_MAX_CHANGES - 1, used: 0, resetLabel, willConsume: true };
  }

  const used = user.usernameChangeCount || 0;
  return { remaining: Math.max(0, USERNAME_MAX_CHANGES - (used + 1)), used, resetLabel, willConsume: true };
}

/* ── Main Component ── */

export function ProfileForm({ user }: { user: DbUser }) {
  const router = useRouter();
  const { dictionary } = usePreferences();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [autoSaveLabel, setAutoSaveLabel] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [activeCropTarget, setActiveCropTarget] = useState<"cover" | "avatar" | null>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user.name || "",
      username: user.username || "",
      role: user.role || "",
      avatarUrl: normalizeAvatarUrl(user.image || ""),
      coverImageUrl: normalizeAvatarUrl(user.coverImageUrl || ""),
      avatarCropX: user.avatarCropX ?? 0,
      avatarCropY: user.avatarCropY ?? 0,
      avatarCropZoom: user.avatarCropZoom ?? 100,
      coverCropX: user.coverCropX ?? 0,
      coverCropY: user.coverCropY ?? 0,
      coverCropZoom: user.coverCropZoom ?? 100,
      bio: user.bio || "",
      experience: user.experience || "",
      birthDate: user.birthDate || "",
      city: user.city || "",
      skills: user.skills.join(", "),
    },
  });

  const watchedName = useWatch({ control: form.control, name: "fullName" });
  const watchedAvatar = useWatch({ control: form.control, name: "avatarUrl" });
  const watchedCover = useWatch({ control: form.control, name: "coverImageUrl" });
  const watchedUsername = useWatch({ control: form.control, name: "username" });
  const watchedRole = useWatch({ control: form.control, name: "role" });
  const watchedBio = useWatch({ control: form.control, name: "bio" });
  const watchedExperience = useWatch({ control: form.control, name: "experience" });
  const watchedBirthDate = useWatch({ control: form.control, name: "birthDate" });
  const watchedCity = useWatch({ control: form.control, name: "city" });
  const watchedAvatarCropX = useWatch({ control: form.control, name: "avatarCropX" });
  const watchedAvatarCropY = useWatch({ control: form.control, name: "avatarCropY" });
  const watchedAvatarCropZoom = useWatch({ control: form.control, name: "avatarCropZoom" });
  const watchedCoverCropX = useWatch({ control: form.control, name: "coverCropX" });
  const watchedCoverCropY = useWatch({ control: form.control, name: "coverCropY" });
  const watchedCoverCropZoom = useWatch({ control: form.control, name: "coverCropZoom" });

  const normalizedWatchedAvatar = normalizeAvatarUrl(watchedAvatar || "");
  const normalizedWatchedCover = normalizeAvatarUrl(watchedCover || "");
  const avatarCrop = normalizeImageCrop({ x: watchedAvatarCropX, y: watchedAvatarCropY, zoom: watchedAvatarCropZoom });
  const coverCrop = normalizeImageCrop({ x: watchedCoverCropX, y: watchedCoverCropY, zoom: watchedCoverCropZoom });
  const previewAvatar = normalizedWatchedAvatar;
  const previewCover = normalizedWatchedCover;
  const publicProfileHref = `/creator/${watchedUsername || user.username}`;
  const usernameQuota = useMemo(() => getUsernameQuota(user, watchedUsername || ""), [user, watchedUsername]);

  const appendTextBlock = (field: "bio" | "experience", block: "bullet" | "paragraph") => {
    const currentValue = form.getValues(field) || "";
    const normalizedValue = currentValue.replace(/\s+$/, "");
    const prefix = normalizedValue ? "\n\n" : "";
    const nextValue = block === "bullet"
      ? `${normalizedValue}${prefix}- `
      : `${normalizedValue}${prefix}Tulis paragraf baru di sini...`;
    form.setValue(field, nextValue, { shouldDirty: true, shouldValidate: true });
  };

  const buildProfilePayload = useCallback((values: FormValues) => {
    const avatarCropValues = normalizeImageCrop({ x: values.avatarCropX, y: values.avatarCropY, zoom: values.avatarCropZoom });
    const coverCropValues = normalizeImageCrop({ x: values.coverCropX, y: values.coverCropY, zoom: values.coverCropZoom });

    return {
      fullName: values.fullName,
      username: values.username,
      role: values.role.trim(),
      avatarUrl: normalizeAvatarUrl(values.avatarUrl || ""),
      coverImageUrl: normalizeAvatarUrl(values.coverImageUrl || ""),
      bio: values.bio,
      experience: values.experience,
      birthDate: values.birthDate?.trim() || "",
      city: values.city.trim(),
      address: user.address || "",
      contactEmail: user.contactEmail || "",
      phoneNumber: user.phoneNumber || "",
      websiteUrl: user.websiteUrl || "",
      instagramUrl: user.instagramUrl || "",
      youtubeUrl: user.youtubeUrl || "",
      facebookUrl: user.facebookUrl || "",
      threadsUrl: user.threadsUrl || "",
      linkedinUrl: user.linkedinUrl || "",
      avatarCropX: avatarCropValues.x,
      avatarCropY: avatarCropValues.y,
      avatarCropZoom: avatarCropValues.zoom,
      coverCropX: coverCropValues.x,
      coverCropY: coverCropValues.y,
      coverCropZoom: coverCropValues.zoom,
      skills: values.skills.split(",").map((item) => item.trim()).filter(Boolean),
      customLinks: user.customLinks || [],
    };
  }, [user]);

  const onSubmit = form.handleSubmit(async (values) => {
    setMessage("");
    setError("");

    const currentUsername = user.username || "";
    const nextUsername = values.username.trim();
    if (nextUsername && nextUsername !== currentUsername) {
      const confirmed = window.confirm(
        `Ganti username dari @${currentUsername || "creator"} ke @${nextUsername}? (Maks ${USERNAME_MAX_CHANGES}x per ${USERNAME_WINDOW_DAYS} hari)`
      );
      if (!confirmed) return;
    }

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildProfilePayload(values)),
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setError(payload?.error ?? "Gagal memperbarui profil.");
      return;
    }

    setMessage("Profil berhasil diperbarui.");
    router.refresh();
  });

  useEffect(() => {
    if (!form.formState.isDirty || form.formState.isSubmitting) return;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(async () => {
      const nextUsername = form.getValues("username").trim();
      const currentUsername = user.username || "";
      if (nextUsername !== currentUsername) return;

      const valid = await form.trigger(undefined, { shouldFocus: false });
      if (!valid) return;

      setAutoSaveLabel("saving");
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildProfilePayload(form.getValues())),
      });

      if (!response.ok) {
        setAutoSaveLabel("error");
        return;
      }

      setAutoSaveLabel("saved");
      setTimeout(() => setAutoSaveLabel("idle"), 1800);
      router.refresh();
    }, 1200);

    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  }, [
    form, form.formState.isDirty, form.formState.isSubmitting,
    buildProfilePayload, router, user.username,
    watchedAvatar, watchedBio, watchedBirthDate, watchedCity,
    watchedCover, watchedExperience, watchedName, watchedRole, watchedUsername,
  ]);

  return (
    <>
      <div className="mx-auto w-full max-w-5xl space-y-4">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">
            {dictionary.editProfile}
          </h1>
          <span className="text-xs text-slate-400">
            {autoSaveLabel === "saving" ? "Menyimpan..." : autoSaveLabel === "saved" ? "✓ Tersimpan" : autoSaveLabel === "error" ? "⚠ Error" : ""}
          </span>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 lg:grid-cols-2">
          {/* ── Cover & Avatar Card ── */}
          <div className="bento-card p-0 overflow-hidden lg:col-span-2">
            {/* Cover banner with inline controls */}
            <div className="group/cover relative w-full aspect-[3/1] bg-gradient-to-br from-slate-100 via-slate-50 to-white">
              {previewCover ? (
                <div
                  className="absolute inset-0 rounded-t-[var(--bento-radius)]"
                  style={getBackgroundImageCropStyle(previewCover, coverCrop)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-slate-200" />
                </div>
              )}

              {/* Cover action buttons - appear on hover */}
              {previewCover && (
                <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-lg bg-black/40 p-1 opacity-0 backdrop-blur-sm transition-opacity group-hover/cover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setActiveCropTarget("cover")}
                    className="rounded-md p-1.5 text-white/90 transition hover:bg-white/20 hover:text-white"
                    title="Crop Cover"
                  >
                    <Crop className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      form.setValue("coverImageUrl", "", { shouldDirty: true, shouldValidate: true });
                      form.setValue("coverCropX", 0, { shouldDirty: true });
                      form.setValue("coverCropY", 0, { shouldDirty: true });
                      form.setValue("coverCropZoom", 100, { shouldDirty: true });
                    }}
                    className="rounded-md p-1.5 text-white/90 transition hover:bg-red-500/60 hover:text-white"
                    title="Hapus Cover"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Avatar overlay with action */}
              <div className="group/avatar absolute -bottom-7 left-5 sm:-bottom-8 sm:left-6">
                <div className="relative">
                  <div className="rounded-full ring-[3px] ring-white shadow-sm">
                    <AvatarBadge
                      name={watchedName || user.name || "Creator"}
                      avatarUrl={previewAvatar}
                      crop={avatarCrop}
                      size="lg"
                    />
                  </div>
                  {/* Avatar action buttons */}
                  {previewAvatar && (
                    <div className="absolute -right-1 -top-1 flex items-center gap-0.5 rounded-full bg-black/50 p-0.5 opacity-0 backdrop-blur-sm transition-opacity group-hover/avatar:opacity-100">
                      <button
                        type="button"
                        onClick={() => setActiveCropTarget("avatar")}
                        className="rounded-full p-1 text-white/90 transition hover:bg-white/20 hover:text-white"
                        title="Crop Avatar"
                      >
                        <Crop className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          form.setValue("avatarUrl", "", { shouldDirty: true, shouldValidate: true });
                          form.setValue("avatarCropX", 0, { shouldDirty: true });
                          form.setValue("avatarCropY", 0, { shouldDirty: true });
                          form.setValue("avatarCropZoom", 100, { shouldDirty: true });
                        }}
                        className="rounded-full p-1 text-white/90 transition hover:bg-red-500/60 hover:text-white"
                        title="Hapus Avatar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Minimal URL inputs - collapsible */}
            <div className="px-5 pb-4 pt-11 sm:px-6 sm:pt-12">
              <details className="group/urls">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-slate-400 transition hover:text-slate-600 [&::-webkit-details-marker]:hidden">
                  <ChevronDown className="h-3 w-3 transition-transform group-open/urls:rotate-180" />
                  Ubah URL gambar
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <ImageIcon className="h-3 w-3 text-slate-400" />
                      <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Cover</label>
                    </div>
                    <Input
                      className="text-sm h-9 bg-slate-50 border-slate-200 focus:bg-white"
                      placeholder="https://..."
                      {...form.register("coverImageUrl", {
                        onBlur: (event) => {
                          const normalized = normalizeAvatarUrl(event.target.value);
                          const hasChanged = normalized !== normalizeAvatarUrl(watchedCover || "");
                          form.setValue("coverImageUrl", normalized, { shouldDirty: true, shouldValidate: true });
                          if (hasChanged) {
                            form.setValue("coverCropX", 0, { shouldDirty: true });
                            form.setValue("coverCropY", 0, { shouldDirty: true });
                            form.setValue("coverCropZoom", 100, { shouldDirty: true });
                          }
                        },
                      })}
                    />
                    <p className="mt-0.5 text-xs text-rose-600">{form.formState.errors.coverImageUrl?.message}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <UserCircle className="h-3 w-3 text-slate-400" />
                      <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Avatar</label>
                    </div>
                    <Input
                      className="text-sm h-9 bg-slate-50 border-slate-200 focus:bg-white"
                      placeholder="https://..."
                      {...form.register("avatarUrl", {
                        onBlur: (event) => {
                          const normalized = normalizeAvatarUrl(event.target.value);
                          const hasChanged = normalized !== normalizeAvatarUrl(watchedAvatar || "");
                          form.setValue("avatarUrl", normalized, { shouldDirty: true, shouldValidate: true });
                          if (hasChanged) {
                            form.setValue("avatarCropX", 0, { shouldDirty: true });
                            form.setValue("avatarCropY", 0, { shouldDirty: true });
                            form.setValue("avatarCropZoom", 100, { shouldDirty: true });
                          }
                        },
                      })}
                    />
                    <p className="mt-0.5 text-xs text-rose-600">{form.formState.errors.avatarUrl?.message}</p>
                  </div>
                </div>
              </details>
            </div>
          </div>

          {/* ── Identity Card ── */}
          <div className="bento-card">
            <div className="mb-3 flex items-center gap-2">
              <UserRoundPen className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-800">Identitas</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Nama Lengkap</label>
                <Input className="text-sm" {...form.register("fullName")} />
                <p className="mt-0.5 text-xs text-rose-600">{form.formState.errors.fullName?.message}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Role</label>
                <Input className="text-sm" placeholder="Video Editor, Videografer" {...form.register("role")} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Username</label>
                <Input className="text-sm" {...form.register("username")} />
                <p className="mt-0.5 text-xs text-rose-600">{form.formState.errors.username?.message}</p>
                {usernameQuota.willConsume && (
                  <p className="mt-0.5 text-[11px] text-amber-600">Sisa {usernameQuota.remaining} perubahan</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Lahir</label>
                  <Input className="text-sm" type="date" {...form.register("birthDate")} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Kota</label>
                  <Input className="text-sm" placeholder="Yogyakarta" {...form.register("city")} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Bio & Experience Card ── */}
          <div className="bento-card">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-800">Bio & Experience</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-500">Bio</label>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => appendTextBlock("bio", "bullet")} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Bullet">
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => appendTextBlock("bio", "paragraph")} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Paragraf">
                      <Pilcrow className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <Textarea className="min-h-24 resize-y text-sm" {...form.register("bio")} />
                <p className="mt-0.5 text-xs text-rose-600">{form.formState.errors.bio?.message}</p>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-500">Experience</label>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => appendTextBlock("experience", "bullet")} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Bullet">
                      <List className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => appendTextBlock("experience", "paragraph")} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Paragraf">
                      <Pilcrow className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <Textarea className="min-h-24 resize-y text-sm" {...form.register("experience")} />
                <p className="mt-0.5 text-xs text-rose-600">{form.formState.errors.experience?.message}</p>
              </div>
            </div>
          </div>

          {/* ── Skills Card ── */}
          <div className="bento-card">
            <div className="mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4 text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-800">Skills</h2>
            </div>
            <Input className="text-sm" placeholder="Video editor, drone, event recap, short form" {...form.register("skills")} />
            <p className="mt-0.5 text-xs text-rose-600">{form.formState.errors.skills?.message}</p>
          </div>

          {/* ── Build Link Redirect ── */}
          <div className="bento-card-subtle flex flex-wrap items-center justify-between gap-3 lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <Link2 className="h-4 w-4 text-slate-400" />
              <p className="text-sm text-slate-600">
                Kontak, social media & link →{" "}
                <Link href="/dashboard/link-builder" className="font-medium text-slate-900 underline-offset-2 hover:underline">
                  Build Link
                </Link>
              </p>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="space-y-3 pt-1 lg:col-span-2">
            {message && <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">{message}</p>}
            {error && <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</p>}
            <div className="flex items-center gap-2.5">
              <Button type="submit" disabled={form.formState.isSubmitting} className="rounded-xl px-5">
                {form.formState.isSubmitting ? "Menyimpan..." : "Simpan Profil"}
              </Button>
              <Link href={publicProfileHref}>
                <Button type="button" variant="secondary" className="rounded-xl px-5">Lihat Profil</Button>
              </Link>
            </div>
          </div>
        </form>
      </div>

      {/* ── Crop Dialogs ── */}
      {activeCropTarget === "cover" && normalizedWatchedCover ? (
        <ImageCropDialog
          key={`cover-${normalizedWatchedCover}-${coverCrop.x}-${coverCrop.y}-${coverCrop.zoom}`}
          open
          title="Crop Cover"
          aspectRatio={3}
          imageSrc={normalizedWatchedCover}
          initialCrop={coverCrop}
          onCancel={() => setActiveCropTarget(null)}
          onConfirm={(crop) => {
            form.setValue("coverCropX", crop.x, { shouldDirty: true });
            form.setValue("coverCropY", crop.y, { shouldDirty: true });
            form.setValue("coverCropZoom", crop.zoom, { shouldDirty: true });
            setActiveCropTarget(null);
          }}
        />
      ) : null}
      {activeCropTarget === "avatar" && normalizedWatchedAvatar ? (
        <ImageCropDialog
          key={`avatar-${normalizedWatchedAvatar}-${avatarCrop.x}-${avatarCrop.y}-${avatarCrop.zoom}`}
          open
          title="Crop Avatar"
          aspectRatio={1}
          shape="circle"
          imageSrc={normalizedWatchedAvatar}
          initialCrop={avatarCrop}
          onCancel={() => setActiveCropTarget(null)}
          onConfirm={(crop) => {
            form.setValue("avatarCropX", crop.x, { shouldDirty: true });
            form.setValue("avatarCropY", crop.y, { shouldDirty: true });
            form.setValue("avatarCropZoom", crop.zoom, { shouldDirty: true });
            setActiveCropTarget(null);
          }}
        />
      ) : null}
    </>
  );
}
