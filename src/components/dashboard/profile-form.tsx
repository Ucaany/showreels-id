"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import {
  Link2,
  List,
  MapPinHouse,
  Pilcrow,
  Sparkles,
  Tag,
  UserRoundPen,
} from "lucide-react";
import { AvatarBadge } from "@/components/avatar-badge";
import { ImageCropDialog } from "@/components/dashboard/image-crop-dialog";
import { ProfileRichText } from "@/components/profile-rich-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePreferences } from "@/hooks/use-preferences";
import type { DbUser } from "@/db/schema";
import { normalizeAvatarUrl } from "@/lib/avatar-utils";
import { getBackgroundImageCropStyle, normalizeImageCrop } from "@/lib/image-crop";
import {
  getAgeFromBirthDate,
  normalizeSocialUrl,
} from "@/lib/profile-utils";
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
      message: "Upload file langsung tidak didukung. Gunakan URL avatar.",
    })
    .refine((value) => value === "" || normalizeAvatarUrl(value).startsWith("http"), {
      message: "Gunakan URL avatar http/https yang valid.",
    }),
  coverImageUrl: z
    .string()
    .max(1200, "URL cover terlalu panjang.")
    .refine((value) => !String(value || "").toLowerCase().startsWith("data:"), {
      message: "Upload file langsung tidak didukung. Gunakan URL cover.",
    })
    .refine((value) => value === "" || normalizeAvatarUrl(value).startsWith("http"), {
      message: "Gunakan URL cover http/https yang valid.",
    }),
  bio: z.string().max(240, "Bio maksimal 240 karakter."),
  experience: z.string().max(700, "Pengalaman maksimal 700 karakter."),
  birthDate: z.string().optional(),
  city: z.string().max(120, "Kota terlalu panjang."),
  address: z.string().max(240, "Alamat terlalu panjang."),
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
          ).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : null,
      willConsume: false,
    };
  }

  const windowStart = user.usernameChangeWindowStart;
  if (!windowStart) {
    return {
      remaining: USERNAME_MAX_CHANGES - 1,
      used: 0,
      resetLabel: null,
      willConsume: true,
    };
  }

  const now = Date.now();
  const resetAt =
    windowStart.getTime() + USERNAME_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const resetLabel = new Date(resetAt).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  if (now >= resetAt) {
    return {
      remaining: USERNAME_MAX_CHANGES - 1,
      used: 0,
      resetLabel,
      willConsume: true,
    };
  }

  const used = user.usernameChangeCount || 0;
  return {
    remaining: Math.max(0, USERNAME_MAX_CHANGES - (used + 1)),
    used,
    resetLabel,
    willConsume: true,
  };
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{children}</p>;
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
      address: user.address || "",
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
  const watchedAddress = useWatch({ control: form.control, name: "address" });
  const watchedAvatarCropX = useWatch({ control: form.control, name: "avatarCropX" });
  const watchedAvatarCropY = useWatch({ control: form.control, name: "avatarCropY" });
  const watchedAvatarCropZoom = useWatch({ control: form.control, name: "avatarCropZoom" });
  const watchedCoverCropX = useWatch({ control: form.control, name: "coverCropX" });
  const watchedCoverCropY = useWatch({ control: form.control, name: "coverCropY" });
  const watchedCoverCropZoom = useWatch({ control: form.control, name: "coverCropZoom" });

  const normalizedWatchedAvatar = normalizeAvatarUrl(watchedAvatar || "");
  const normalizedWatchedCover = normalizeAvatarUrl(watchedCover || "");
  const avatarCrop = normalizeImageCrop({
    x: watchedAvatarCropX,
    y: watchedAvatarCropY,
    zoom: watchedAvatarCropZoom,
  });
  const coverCrop = normalizeImageCrop({
    x: watchedCoverCropX,
    y: watchedCoverCropY,
    zoom: watchedCoverCropZoom,
  });
  const previewAvatar = normalizedWatchedAvatar;
  const previewCover = normalizedWatchedCover;
  const age = getAgeFromBirthDate(watchedBirthDate || user.birthDate || "");
  const publicProfileHref = `/creator/${watchedUsername || user.username}`;
  const usernameQuota = useMemo(
    () => getUsernameQuota(user, watchedUsername || ""),
    [user, watchedUsername]
  );

  const appendTextBlock = (
    field: "bio" | "experience",
    block: "bullet" | "paragraph"
  ) => {
    const currentValue = form.getValues(field) || "";
    const normalizedValue = currentValue.replace(/\s+$/, "");
    const prefix = normalizedValue ? "\n\n" : "";
    const nextValue =
      block === "bullet"
        ? `${normalizedValue}${prefix}- `
        : `${normalizedValue}${prefix}Tulis paragraf baru di sini...`;

    form.setValue(field, nextValue, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const buildProfilePayload = useCallback((values: FormValues) => {
    const avatarCropValues = normalizeImageCrop({
      x: values.avatarCropX,
      y: values.avatarCropY,
      zoom: values.avatarCropZoom,
    });
    const coverCropValues = normalizeImageCrop({
      x: values.coverCropX,
      y: values.coverCropY,
      zoom: values.coverCropZoom,
    });

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
      address: values.address.trim(),
      // Pass through existing social/contact values (managed on Build Link page)
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
      skills: values.skills
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
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
        `Kamu akan mengganti username dari @${currentUsername || "creator"} menjadi @${nextUsername}. Username hanya bisa diubah maksimal ${USERNAME_MAX_CHANGES} kali per ${USERNAME_WINDOW_DAYS} hari. Lanjutkan?`
      );
      if (!confirmed) {
        return;
      }
    }

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildProfilePayload(values)),
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setError(payload?.error ?? "Gagal memperbarui profil.");
      return;
    }

    setMessage("Profil berhasil diperbarui.");
    router.refresh();
  });

  useEffect(() => {
    if (!form.formState.isDirty || form.formState.isSubmitting) {
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = setTimeout(async () => {
      const nextUsername = form.getValues("username").trim();
      const currentUsername = user.username || "";

      if (nextUsername !== currentUsername) {
        return;
      }

      const valid = await form.trigger(undefined, { shouldFocus: false });
      if (!valid) {
        return;
      }

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

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [
    form,
    form.formState.isDirty,
    form.formState.isSubmitting,
    buildProfilePayload,
    router,
    user.username,
    watchedAddress,
    watchedAvatar,
    watchedBio,
    watchedBirthDate,
    watchedCity,
    watchedCover,
    watchedExperience,
    watchedName,
    watchedRole,
    watchedUsername,
  ]);

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* ── Main Form Column ── */}
        <div className="min-w-0 space-y-4">
          {/* Page Header */}
          <div className="bento-card bento-card-full">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-display text-xl font-semibold text-slate-900 sm:text-2xl">
                  {dictionary.editProfile}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Kelola identitas creator dari satu halaman yang rapi.
                </p>
              </div>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                {autoSaveLabel === "saving"
                  ? "⏳ Menyimpan..."
                  : autoSaveLabel === "saved"
                    ? "✓ Tersimpan"
                    : autoSaveLabel === "error"
                      ? "⚠ Gagal simpan"
                      : "Auto-save aktif"}
              </span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Bento Grid */}
            <div className="bento-profile-grid">
              {/* ── Visual Profile Card ── */}
              <div className="bento-card">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-slate-600" />
                  <h2 className="text-sm font-semibold text-slate-900">
                    Visual Profile
                  </h2>
                </div>

                {/* Cover Preview */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Cover Creator
                  </label>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
                    <div
                      className="relative aspect-video w-full"
                      style={
                        previewCover
                          ? getBackgroundImageCropStyle(
                              previewCover,
                              coverCrop,
                              "linear-gradient(180deg, rgba(15,23,42,0.06), rgba(15,23,42,0.18))"
                            )
                          : undefined
                      }
                    >
                      <div className="absolute inset-0 flex items-end justify-between gap-3 p-3">
                        <p className="text-xs text-slate-600">
                          {previewCover ? "Cover siap." : "Tempel URL cover."}
                        </p>
                        <AvatarBadge
                          name={watchedName || user.name || "Creator"}
                          avatarUrl={previewAvatar}
                          crop={avatarCrop}
                          size="lg"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {previewCover ? (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setActiveCropTarget("cover")}
                        >
                          Crop Cover
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            form.setValue("coverImageUrl", "", { shouldDirty: true, shouldValidate: true });
                            form.setValue("coverCropX", 0, { shouldDirty: true });
                            form.setValue("coverCropY", 0, { shouldDirty: true });
                            form.setValue("coverCropZoom", 100, { shouldDirty: true });
                          }}
                        >
                          Hapus
                        </Button>
                      </>
                    ) : null}
                  </div>
                  <Input
                    placeholder="Tempel link cover image atau Google Drive..."
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
                  <p className="text-xs text-rose-600">
                    {form.formState.errors.coverImageUrl?.message}
                  </p>
                </div>

                {/* Avatar */}
                <div className="mt-5 space-y-3">
                  <label className="block text-sm font-medium text-slate-700">
                    Avatar Profil
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {previewAvatar ? (
                      <>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setActiveCropTarget("avatar")}
                        >
                          Crop Avatar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            form.setValue("avatarUrl", "", { shouldDirty: true, shouldValidate: true });
                            form.setValue("avatarCropX", 0, { shouldDirty: true });
                            form.setValue("avatarCropY", 0, { shouldDirty: true });
                            form.setValue("avatarCropZoom", 100, { shouldDirty: true });
                          }}
                        >
                          Hapus
                        </Button>
                      </>
                    ) : null}
                  </div>
                  <Input
                    placeholder="Tempel link gambar atau Google Drive..."
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
                  <p className="text-xs text-rose-600">
                    {form.formState.errors.avatarUrl?.message}
                  </p>
                  <FieldHint>
                    Gunakan URL gambar publik (http/https atau Google Drive).
                  </FieldHint>
                </div>
              </div>

              {/* ── Identity Card ── */}
              <div className="bento-card">
                <div className="mb-4 flex items-center gap-2">
                  <UserRoundPen className="h-4 w-4 text-slate-600" />
                  <h2 className="text-sm font-semibold text-slate-900">
                    Identitas Utama
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Nama Lengkap
                    </label>
                    <Input {...form.register("fullName")} />
                    <p className="mt-1 text-xs text-rose-600">
                      {form.formState.errors.fullName?.message}
                    </p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Role Utama
                    </label>
                    <Input
                      placeholder="Contoh: Video Editor, Videografer"
                      {...form.register("role")}
                    />
                    <FieldHint>
                      Role tampil di profile untuk membantu client memahami keahlian kamu.
                    </FieldHint>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Username
                    </label>
                    <Input {...form.register("username")} />
                    <p className="mt-1 text-xs text-rose-600">
                      {form.formState.errors.username?.message}
                    </p>
                    <FieldHint>
                      Maks {USERNAME_MAX_CHANGES}x ubah per {USERNAME_WINDOW_DAYS} hari.
                      {usernameQuota.resetLabel
                        ? ` Reset: ${usernameQuota.resetLabel}.`
                        : ""}
                    </FieldHint>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Tanggal Lahir
                      </label>
                      <Input type="date" {...form.register("birthDate")} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Kota Tinggal
                      </label>
                      <Input
                        placeholder="Contoh: Yogyakarta"
                        {...form.register("city")}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Bio & Experience Card (full width) ── */}
              <div className="bento-card bento-card-full">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-slate-600" />
                  <h2 className="text-sm font-semibold text-slate-900">
                    Bio & Experience
                  </h2>
                </div>
                <div className="grid gap-5 lg:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Bio
                    </label>
                    <div className="mb-2 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 rounded-full p-0"
                        onClick={() => appendTextBlock("bio", "bullet")}
                        aria-label="Tambah point ke bio"
                        title="Tambah point"
                      >
                        <List className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-full p-0"
                        onClick={() => appendTextBlock("bio", "paragraph")}
                        aria-label="Tambah paragraf ke bio"
                        title="Tambah paragraf"
                      >
                        <Pilcrow className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Textarea className="min-h-28 resize-y" {...form.register("bio")} />
                    <p className="mt-1 text-xs text-rose-600">
                      {form.formState.errors.bio?.message}
                    </p>
                    <FieldHint>
                      Mendukung emoji, bullet, dan paragraf pendek.
                    </FieldHint>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Experience
                    </label>
                    <div className="mb-2 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 w-8 rounded-full p-0"
                        onClick={() => appendTextBlock("experience", "bullet")}
                        aria-label="Tambah point ke experience"
                        title="Tambah point"
                      >
                        <List className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 rounded-full p-0"
                        onClick={() => appendTextBlock("experience", "paragraph")}
                        aria-label="Tambah paragraf ke experience"
                        title="Tambah paragraf"
                      >
                        <Pilcrow className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Textarea className="min-h-28 resize-y" {...form.register("experience")} />
                    <p className="mt-1 text-xs text-rose-600">
                      {form.formState.errors.experience?.message}
                    </p>
                    <FieldHint>
                      Pengalaman mendukung emoji, bullet, dan paragraf.
                    </FieldHint>
                  </div>
                </div>
              </div>

              {/* ── Skills Card ── */}
              <div className="bento-card">
                <div className="mb-4 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-slate-600" />
                  <h2 className="text-sm font-semibold text-slate-900">
                    Skills
                  </h2>
                </div>
                <Input
                  placeholder="Video editor, drone, event recap, short form"
                  {...form.register("skills")}
                />
                <p className="mt-1 text-xs text-rose-600">
                  {form.formState.errors.skills?.message}
                </p>
                <FieldHint>
                  Pisahkan dengan koma. Tampil sebagai tag di profil publik.
                </FieldHint>
              </div>

              {/* ── Internal Address Card ── */}
              <div className="bento-card">
                <div className="mb-4 flex items-center gap-2">
                  <MapPinHouse className="h-4 w-4 text-slate-600" />
                  <h2 className="text-sm font-semibold text-slate-900">
                    Alamat Internal
                  </h2>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 ring-1 ring-amber-200">
                    Dashboard only
                  </span>
                </div>
                <Textarea
                  className="min-h-20 resize-y"
                  placeholder="Alamat ini hanya terlihat di dashboard, tidak tampil di profil publik."
                  {...form.register("address")}
                />
                <p className="mt-1 text-xs text-rose-600">
                  {form.formState.errors.address?.message}
                </p>
                <FieldHint>
                  Cocok untuk menyimpan alamat internal, kebutuhan invoice, atau pengiriman alat.
                </FieldHint>
              </div>

              {/* ── Build Link Redirect Card (full width) ── */}
              <div className="bento-card-subtle bento-card-full">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 ring-1 ring-slate-200">
                      <Link2 className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Kontak, social media & link
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                        Kelola tombol, social media, kontak publik, dan block dari halaman Build Link.
                      </p>
                    </div>
                  </div>
                  <Link href="/dashboard/link-builder">
                    <Button type="button" variant="secondary" size="sm">
                      Buka Build Link
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Actions ── */}
            <div className="bento-card">
              {message ? (
                <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {message}
                </p>
              ) : null}
              {error ? (
                <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
                <Link href={publicProfileHref}>
                  <Button type="button" variant="secondary">
                    Lihat Profil Publik
                  </Button>
                </Link>
              </div>
            </div>
          </form>
        </div>

        {/* ── Sidebar Preview ── */}
        <div className="min-w-0 xl:sticky xl:top-24 xl:h-fit">
          <div className="bento-card space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">
              {dictionary.publicProfile}
            </h2>

            {/* Cover Preview */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100">
              <div
                className="aspect-video w-full"
                style={
                  previewCover
                    ? {
                        backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.06), rgba(15,23,42,0.18)), url(${previewCover})`,
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "cover",
                      }
                    : undefined
                }
              />
            </div>

            {/* Identity Preview */}
            <div className="flex items-center gap-3">
              <AvatarBadge
                name={watchedName || user.name || "Creator"}
                avatarUrl={previewAvatar}
                size="lg"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">
                  {watchedName || user.name}
                </p>
                <p className="truncate text-sm font-medium text-slate-600">
                  {watchedRole || user.role || "Role belum diisi"}
                </p>
                <p className="text-xs text-slate-500">
                  @{watchedUsername || user.username}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-sm text-slate-700">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ringkasan
              </p>
              <div className="mt-2 space-y-1 text-xs text-slate-600">
                <p>Umur: {age !== null ? `${age} tahun` : "Belum diatur"}</p>
                <p>Kota: {watchedCity || user.city || "Belum diisi"}</p>
              </div>
            </div>

            {/* Bio Preview */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Bio
              </p>
              <ProfileRichText
                content={watchedBio}
                emptyLabel="Bio akan tampil di sini saat diisi."
              />
            </div>

            {/* Experience Preview */}
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Experience
              </p>
              <ProfileRichText
                content={watchedExperience}
                emptyLabel="Experience akan tampil di sini saat diisi."
              />
            </div>

            {/* Internal Address */}
            <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Alamat internal (tidak publik)
              </p>
              <p className="mt-1 break-words text-xs text-slate-600">
                {watchedAddress || user.address || "Belum diisi."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Crop Dialogs ── */}
      {activeCropTarget === "cover" && normalizedWatchedCover ? (
        <ImageCropDialog
          key={`cover-${normalizedWatchedCover}-${coverCrop.x}-${coverCrop.y}-${coverCrop.zoom}`}
          open
          title="Crop Cover"
          aspectRatio={16 / 9}
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
