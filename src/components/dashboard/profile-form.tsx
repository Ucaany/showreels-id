"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import {
  ArrowDown,
  ArrowUp,
  Link2,
  List,
  MapPinHouse,
  Pilcrow,
  Plus,
  Sparkles,
  Trash2,
  UserRoundPen,
} from "lucide-react";
import { AvatarBadge } from "@/components/avatar-badge";
import { CustomLinksList } from "@/components/custom-links-list";
import { ImageCropDialog } from "@/components/dashboard/image-crop-dialog";
import { ProfileRichText } from "@/components/profile-rich-text";
import { SocialLinks } from "@/components/social-links";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePreferences } from "@/hooks/use-preferences";
import type { DbUser } from "@/db/schema";
import { normalizeAvatarUrl } from "@/lib/avatar-utils";
import { getBackgroundImageCropStyle, normalizeImageCrop } from "@/lib/image-crop";
import {
  MAX_CUSTOM_LINKS,
  MAX_LINK_DESCRIPTION_LENGTH,
  MAX_LINK_TITLE_LENGTH,
  normalizeCustomLinks,
  getAgeFromBirthDate,
  normalizeSocialUrl,
} from "@/lib/profile-utils";
import { isReservedUsername, USERNAME_REGEX } from "@/lib/username-rules";

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
  contactEmail: z.string().max(120, "Email terlalu panjang."),
  phoneNumber: z.string().max(30, "Nomor telepon terlalu panjang."),
  websiteUrl: z.string().max(300, "Website terlalu panjang."),
  instagramUrl: z.string().max(300, "URL terlalu panjang."),
  youtubeUrl: z.string().max(300, "URL terlalu panjang."),
  facebookUrl: z.string().max(300, "URL terlalu panjang."),
  threadsUrl: z.string().max(300, "URL terlalu panjang."),
  customLinks: z
    .array(
      z.object({
        id: z.string().trim().min(1, "ID custom link tidak valid.").max(80),
        title: z
          .string()
          .trim()
          .min(1, "Judul link wajib diisi.")
          .max(MAX_LINK_TITLE_LENGTH, `Judul maksimal ${MAX_LINK_TITLE_LENGTH} karakter.`),
        url: z
          .string()
          .trim()
          .max(300, "URL link terlalu panjang.")
          .refine((value) => normalizeSocialUrl(value).startsWith("http"), {
            message: "Gunakan URL http/https yang valid.",
          }),
        description: z
          .string()
          .trim()
          .max(
            MAX_LINK_DESCRIPTION_LENGTH,
            `Deskripsi maksimal ${MAX_LINK_DESCRIPTION_LENGTH} karakter.`
          )
          .optional(),
        platform: z.string().trim().max(30, "Platform terlalu panjang.").optional(),
        badge: z.string().trim().max(30, "Badge terlalu panjang.").optional(),
        enabled: z.boolean(),
        order: z.number().int().min(0).max(99),
      })
    )
    .max(MAX_CUSTOM_LINKS, `Maksimal ${MAX_CUSTOM_LINKS} custom link.`),
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

function createCustomLinkId(seed: number) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `custom-link-${Date.now()}-${seed}`;
}

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
  return <p className="mt-1 text-xs text-slate-500">{children}</p>;
}

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
      contactEmail: user.contactEmail || "",
      phoneNumber: user.phoneNumber || "",
      websiteUrl: user.websiteUrl || "",
      instagramUrl: user.instagramUrl || "",
      youtubeUrl: user.youtubeUrl || "",
      facebookUrl: user.facebookUrl || "",
      threadsUrl: user.threadsUrl || "",
      customLinks: normalizeCustomLinks(user.customLinks).map((link) => ({
        id: link.id,
        title: link.title,
        url: link.url,
        description: link.description || "",
        platform: link.platform || "",
        badge: link.badge || "",
        enabled: link.enabled !== false,
        order: link.order,
      })),
      skills: user.skills.join(", "),
    },
  });

  const {
    fields: customLinkFields,
    append: appendCustomLink,
    remove: removeCustomLink,
    move: moveCustomLink,
  } = useFieldArray({
    control: form.control,
    name: "customLinks",
    keyName: "fieldKey",
  });

  const watchedName = useWatch({ control: form.control, name: "fullName" });
  const watchedAvatar = useWatch({ control: form.control, name: "avatarUrl" });
  const watchedCover = useWatch({
    control: form.control,
    name: "coverImageUrl",
  });
  const watchedUsername = useWatch({ control: form.control, name: "username" });
  const watchedRole = useWatch({ control: form.control, name: "role" });
  const watchedBio = useWatch({ control: form.control, name: "bio" });
  const watchedExperience = useWatch({
    control: form.control,
    name: "experience",
  });
  const watchedBirthDate = useWatch({
    control: form.control,
    name: "birthDate",
  });
  const watchedCity = useWatch({ control: form.control, name: "city" });
  const watchedAddress = useWatch({ control: form.control, name: "address" });
  const watchedContactEmail = useWatch({
    control: form.control,
    name: "contactEmail",
  });
  const watchedPhoneNumber = useWatch({
    control: form.control,
    name: "phoneNumber",
  });
  const watchedWebsiteUrl = useWatch({
    control: form.control,
    name: "websiteUrl",
  });
  const watchedInstagram = useWatch({
    control: form.control,
    name: "instagramUrl",
  });
  const watchedYoutube = useWatch({
    control: form.control,
    name: "youtubeUrl",
  });
  const watchedFacebook = useWatch({
    control: form.control,
    name: "facebookUrl",
  });
  const watchedThreads = useWatch({
    control: form.control,
    name: "threadsUrl",
  });
  const watchedCustomLinks = useWatch({
    control: form.control,
    name: "customLinks",
  });
  const watchedAvatarCropX = useWatch({
    control: form.control,
    name: "avatarCropX",
  });
  const watchedAvatarCropY = useWatch({
    control: form.control,
    name: "avatarCropY",
  });
  const watchedAvatarCropZoom = useWatch({
    control: form.control,
    name: "avatarCropZoom",
  });
  const watchedCoverCropX = useWatch({
    control: form.control,
    name: "coverCropX",
  });
  const watchedCoverCropY = useWatch({
    control: form.control,
    name: "coverCropY",
  });
  const watchedCoverCropZoom = useWatch({
    control: form.control,
    name: "coverCropZoom",
  });

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
  const previewCustomLinks = useMemo(
    () => normalizeCustomLinks(watchedCustomLinks || []),
    [watchedCustomLinks]
  );
  const customLinksErrorMessage =
    typeof form.formState.errors.customLinks?.message === "string"
      ? form.formState.errors.customLinks.message
      : "";

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

  const addCustomLink = () => {
    if (customLinkFields.length >= MAX_CUSTOM_LINKS) {
      return;
    }

    appendCustomLink({
      id: createCustomLinkId(customLinkFields.length + 1),
      title: "",
      url: "",
      enabled: true,
      order: customLinkFields.length,
    });
  };

  const moveCustomLinkBy = (index: number, offset: -1 | 1) => {
    const targetIndex = index + offset;
    if (targetIndex < 0 || targetIndex >= customLinkFields.length) {
      return;
    }
    moveCustomLink(index, targetIndex);
  };

  const buildProfilePayload = (values: FormValues) => {
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
      contactEmail: values.contactEmail.trim().toLowerCase(),
      phoneNumber: values.phoneNumber.trim(),
      websiteUrl: normalizeSocialUrl(values.websiteUrl || ""),
      instagramUrl: normalizeSocialUrl(values.instagramUrl || ""),
      youtubeUrl: normalizeSocialUrl(values.youtubeUrl || ""),
      facebookUrl: normalizeSocialUrl(values.facebookUrl || ""),
      threadsUrl: normalizeSocialUrl(values.threadsUrl || ""),
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
      customLinks: normalizeCustomLinks(values.customLinks || []).map((link, index) => ({
        ...link,
        order: index,
      })),
    };
  };

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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildProfilePayload(values)),
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setError(payload?.error ?? "Gagal memperbarui profil.");
      return;
    }

    setMessage("Profil dashboard berhasil diperbarui.");
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

      // Username tetap pakai submit manual agar ada konfirmasi kuota perubahan.
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
        headers: {
          "Content-Type": "application/json",
        },
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
    router,
    user.username,
    watchedAddress,
    watchedAvatar,
    watchedBio,
    watchedBirthDate,
    watchedCity,
    watchedContactEmail,
    watchedCover,
    watchedCustomLinks,
    watchedExperience,
    watchedFacebook,
    watchedInstagram,
    watchedName,
    watchedPhoneNumber,
    watchedRole,
    watchedThreads,
    watchedUsername,
    watchedWebsiteUrl,
    watchedYoutube,
  ]);

  return (
    <>
      <div className="dashboard-profile-mobile grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Card className="dashboard-profile-card overflow-hidden border-border bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))] p-0">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
                    Dashboard profile
                  </p>
                  <h1 className="mt-2 font-display text-2xl font-semibold text-slate-950">
                    {dictionary.editProfile}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                    Rapikan identitas creator, kontak publik, cover, dan avatar
                    dari satu halaman yang lebih rapi.
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    {autoSaveLabel === "saving"
                      ? "Auto-save: menyimpan perubahan..."
                      : autoSaveLabel === "saved"
                        ? "Auto-save: perubahan tersimpan."
                        : autoSaveLabel === "error"
                          ? "Auto-save: gagal menyimpan, cek koneksi."
                          : "Auto-save aktif untuk perubahan profil."}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-5 px-4 py-4 sm:px-6 sm:py-5">
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="profile-panel rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-brand-600" />
                    <h2 className="text-base font-semibold text-slate-950">
                      Visual profile
                    </h2>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Cover Creator
                    </label>
                    <div className="space-y-3">
                      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.20),_transparent_38%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(219,234,254,0.86))]">
                        <div
                          className="relative h-28 w-full sm:h-36"
                          style={
                            previewCover
                              ? getBackgroundImageCropStyle(
                                  previewCover,
                                  coverCrop,
                                  "linear-gradient(180deg, rgba(15,23,42,0.08), rgba(15,23,42,0.22))"
                                )
                              : undefined
                          }
                        >
                          <div className="absolute inset-0 flex items-end justify-between gap-4 p-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                Preview
                              </p>
                              <p className="mt-1 max-w-[13rem] text-xs leading-relaxed text-slate-700 sm:text-sm">
                                {previewCover
                                  ? "Cover sudah siap dipakai."
                                  : "Tempel URL cover landscape agar profile tampil lebih rapi."}
                              </p>
                            </div>
                            <AvatarBadge
                              name={watchedName || user.name || "Creator"}
                              avatarUrl={previewAvatar}
                              crop={avatarCrop}
                              size="lg"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        {previewCover ? (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setActiveCropTarget("cover")}
                            className="w-full sm:w-auto"
                          >
                            Crop Cover
                          </Button>
                        ) : null}
                        {previewCover ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full sm:w-auto"
                            onClick={() => {
                              form.setValue("coverImageUrl", "", {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                              form.setValue("coverCropX", 0, { shouldDirty: true });
                              form.setValue("coverCropY", 0, { shouldDirty: true });
                              form.setValue("coverCropZoom", 100, { shouldDirty: true });
                            }}
                          >
                            Hapus Cover
                          </Button>
                        ) : null}
                      </div>
                      <Input
                        placeholder="Tempel link cover image atau Google Drive..."
                        {...form.register("coverImageUrl", {
                          onBlur: (event) => {
                            const normalized = normalizeAvatarUrl(
                              event.target.value
                            );
                            const hasChanged =
                              normalized !== normalizeAvatarUrl(watchedCover || "");
                            form.setValue("coverImageUrl", normalized, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            if (hasChanged) {
                              form.setValue("coverCropX", 0, { shouldDirty: true });
                              form.setValue("coverCropY", 0, { shouldDirty: true });
                              form.setValue("coverCropZoom", 100, { shouldDirty: true });
                            }
                          },
                        })}
                      />
                      <p className="mt-1 text-xs text-rose-600">
                        {form.formState.errors.coverImageUrl?.message}
                      </p>
                      <FieldHint>
                        Gunakan URL gambar publik (http/https atau Google Drive).
                      </FieldHint>
                      <FieldHint>
                        Crop Cover menyesuaikan framing preview sebelum submit.
                      </FieldHint>
                    </div>
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Avatar Profil
                    </label>
                    <div className="space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        {previewAvatar ? (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setActiveCropTarget("avatar")}
                            className="w-full sm:w-auto"
                          >
                            Crop Avatar
                          </Button>
                        ) : null}
                        {previewAvatar ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full sm:w-auto"
                            onClick={() => {
                              form.setValue("avatarUrl", "", {
                                shouldDirty: true,
                                shouldValidate: true,
                              });
                              form.setValue("avatarCropX", 0, { shouldDirty: true });
                              form.setValue("avatarCropY", 0, { shouldDirty: true });
                              form.setValue("avatarCropZoom", 100, { shouldDirty: true });
                            }}
                          >
                            Hapus Avatar
                          </Button>
                        ) : null}
                      </div>
                      <Input
                        placeholder="Tempel link gambar atau Google Drive..."
                        {...form.register("avatarUrl", {
                          onBlur: (event) => {
                            const normalized = normalizeAvatarUrl(
                              event.target.value
                            );
                            const hasChanged =
                              normalized !== normalizeAvatarUrl(watchedAvatar || "");
                            form.setValue("avatarUrl", normalized, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                            if (hasChanged) {
                              form.setValue("avatarCropX", 0, { shouldDirty: true });
                              form.setValue("avatarCropY", 0, { shouldDirty: true });
                              form.setValue("avatarCropZoom", 100, { shouldDirty: true });
                            }
                          },
                        })}
                      />
                      <p className="mt-1 text-xs text-rose-600">
                        {form.formState.errors.avatarUrl?.message}
                      </p>
                      <FieldHint>
                        Gunakan URL avatar publik (http/https atau Google Drive).
                      </FieldHint>
                      <FieldHint>
                        Crop Avatar menyesuaikan framing preview sebelum submit.
                      </FieldHint>
                    </div>
                  </div>
                </div>

                <div className="profile-panel rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <UserRoundPen className="h-4 w-4 text-brand-600" />
                    <h2 className="text-base font-semibold text-slate-950">
                      Identitas utama
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Nama Lengkap
                      </label>
                      <Input {...form.register("fullName")} />
                      <p className="mt-1 text-xs text-rose-600">
                        {form.formState.errors.fullName?.message}
                      </p>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Role Utama
                      </label>
                      <Input
                        placeholder="Contoh: Video Editor, Videografer, Penulis Naskah"
                        {...form.register("role")}
                      />
                      <FieldHint>
                        Role ini tampil di profile creator untuk membantu client cepat memahami keahlian utama kamu.
                      </FieldHint>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Username
                      </label>
                      <Input {...form.register("username")} />
                      <p className="mt-1 text-xs text-rose-600">
                        {form.formState.errors.username?.message}
                      </p>
                      <FieldHint>
                        Username hanya bisa diubah maksimal{" "}
                        {USERNAME_MAX_CHANGES} kali per {USERNAME_WINDOW_DAYS}{" "}
                        hari.
                        {usernameQuota.resetLabel
                          ? ` Periode aktif reset pada ${usernameQuota.resetLabel}.`
                          : ""}
                      </FieldHint>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Tanggal Lahir
                        </label>
                        <Input type="date" {...form.register("birthDate")} />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Kota Tinggal
                        </label>
                        <Input
                          placeholder="Contoh: Yogyakarta"
                          {...form.register("city")}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Alamat Lengkap (dashboard only)
                      </label>
                      <Textarea
                        className="min-h-24"
                        placeholder="Alamat ini hanya terlihat di dashboard dan tidak tampil di profil publik."
                        {...form.register("address")}
                      />
                      <FieldHint>
                        Cocok untuk menyimpan alamat internal, kebutuhan
                        invoice, atau pengiriman alat.
                      </FieldHint>
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-panel rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-brand-600" />
                  <h2 className="text-base font-semibold text-slate-950">
                    Bio & experience
                  </h2>
                </div>
                <div className="grid gap-5 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Bio
                    </label>
                    <div className="mb-2 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="w-9 rounded-full p-0"
                        onClick={() => appendTextBlock("bio", "bullet")}
                        aria-label="Tambah point ke bio"
                        title="Tambah point"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-9 rounded-full p-0"
                        onClick={() => appendTextBlock("bio", "paragraph")}
                        aria-label="Tambah paragraf ke bio"
                        title="Tambah paragraf"
                      >
                        <Pilcrow className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea {...form.register("bio")} />
                    <FieldHint>
                      Bio mendukung emoji, point, dan paragraf pendek untuk
                      memperjelas positioning creator.
                    </FieldHint>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Experience
                    </label>
                    <div className="mb-2 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="w-9 rounded-full p-0"
                        onClick={() => appendTextBlock("experience", "bullet")}
                        aria-label="Tambah point ke experience"
                        title="Tambah point"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-9 rounded-full p-0"
                        onClick={() =>
                          appendTextBlock("experience", "paragraph")
                        }
                        aria-label="Tambah paragraf ke experience"
                        title="Tambah paragraf"
                      >
                        <Pilcrow className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea {...form.register("experience")} />
                    <FieldHint>
                      Pengalaman juga mendukung emoji, bullet, dan paragraf agar
                      lebih mudah dibaca client.
                    </FieldHint>
                  </div>
                </div>
              </div>

              <div className="profile-panel rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <MapPinHouse className="h-4 w-4 text-brand-600" />
                  <h2 className="text-base font-semibold text-slate-950">
                    Kontak & social media
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Email Contact (publik)
                    </label>
                    <Input
                      placeholder="halo@namakamu.com"
                      {...form.register("contactEmail")}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Nomor Telepon
                    </label>
                    <Input
                      placeholder="+62 812-xxxx-xxxx"
                      {...form.register("phoneNumber")}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Website
                    </label>
                    <Input
                      placeholder="https://portfolio-kamu.com"
                      {...form.register("websiteUrl")}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Instagram
                    </label>
                    <Input
                      placeholder="instagram.com/username"
                      {...form.register("instagramUrl")}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      YouTube Channel
                    </label>
                    <Input
                      placeholder="youtube.com/@channel"
                      {...form.register("youtubeUrl")}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Facebook
                    </label>
                    <Input
                      placeholder="facebook.com/username"
                      {...form.register("facebookUrl")}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Threads
                    </label>
                    <Input
                      placeholder="threads.net/@username"
                      {...form.register("threadsUrl")}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Skills
                    </label>
                    <Input
                      placeholder="Video editor, drone, event recap, short form"
                      {...form.register("skills")}
                    />
                  </div>
                </div>
              </div>

              <div className="profile-panel rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-brand-600" />
                    <h2 className="text-base font-semibold text-slate-950">
                      {dictionary.profileCustomLinksTitle}
                    </h2>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addCustomLink}
                    disabled={customLinkFields.length >= MAX_CUSTOM_LINKS}
                  >
                    <Plus className="h-4 w-4" />
                    {dictionary.profileCustomLinksAdd}
                  </Button>
                </div>
                <FieldHint>{dictionary.profileCustomLinksDescription}</FieldHint>
                <FieldHint>
                  {dictionary.profileCustomLinksLimit.replace(
                    "{max}",
                    String(MAX_CUSTOM_LINKS)
                  )}
                </FieldHint>

                <div className="mt-4 space-y-3">
                  {customLinkFields.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {dictionary.profileCustomLinksEmpty}
                    </p>
                  ) : null}

                  {customLinkFields.map((field, index) => (
                    <div
                      key={field.fieldKey}
                      className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {dictionary.profileCustomLinksLabel} {index + 1}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveCustomLinkBy(index, -1)}
                            disabled={index === 0}
                            title={dictionary.profileCustomLinksMoveUp}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveCustomLinkBy(index, 1)}
                            disabled={index === customLinkFields.length - 1}
                            title={dictionary.profileCustomLinksMoveDown}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCustomLink(index)}
                            title={dictionary.profileCustomLinksRemove}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
                        <div>
                          <Input
                            placeholder={dictionary.profileCustomLinksNamePlaceholder}
                            {...form.register(`customLinks.${index}.title`)}
                          />
                          <p className="mt-1 text-xs text-rose-600">
                            {
                              form.formState.errors.customLinks?.[index]?.title
                                ?.message
                            }
                          </p>
                        </div>
                        <div>
                          <Input
                            placeholder={dictionary.profileCustomLinksUrlPlaceholder}
                            {...form.register(`customLinks.${index}.url`, {
                              onBlur: (event) => {
                                form.setValue(
                                  `customLinks.${index}.url`,
                                  normalizeSocialUrl(event.target.value),
                                  {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  }
                                );
                              },
                            })}
                          />
                          <p className="mt-1 text-xs text-rose-600">
                            {
                              form.formState.errors.customLinks?.[index]?.url
                                ?.message
                            }
                          </p>
                        </div>
                      </div>

                      <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-brand-600"
                          {...form.register(`customLinks.${index}.enabled`)}
                        />
                        {dictionary.profileCustomLinksToggle}
                      </label>

                      <input
                        type="hidden"
                        {...form.register(`customLinks.${index}.id`)}
                      />
                      <input
                        type="hidden"
                        {...form.register(`customLinks.${index}.order`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-rose-600">
                  {customLinksErrorMessage}
                </p>
              </div>

              {message ? (
                <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {message}
                </p>
              ) : null}
              {error ? (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? "Menyimpan..."
                    : "Simpan Perubahan"}
                </Button>
                <Link href={publicProfileHref}>
                  <Button variant="secondary">Lihat Profil Publik</Button>
                </Link>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-5 xl:sticky xl:top-24 xl:h-fit">
          <Card className="space-y-4 border-border bg-surface">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              {dictionary.publicProfile}
            </h2>
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.20),_transparent_42%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(219,234,254,0.86))]">
              <div
                className="h-32 w-full"
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
            <div className="flex items-center gap-3">
              <AvatarBadge
                name={watchedName || user.name || "Creator"}
                avatarUrl={previewAvatar}
                size="lg"
              />
              <div>
                <p className="font-semibold text-slate-900">
                  {watchedName || user.name}
                </p>
                <p className="text-sm font-medium text-brand-700">
                  {watchedRole || user.role || "Role belum diisi"}
                </p>
                <p className="text-sm text-slate-600">
                  @{watchedUsername || user.username}
                </p>
                <p className="text-xs text-slate-600">
                  {watchedCity || user.city || "Kota belum diisi"}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Ringkasan publik</p>
                <p className="mt-2">
                  Umur: {age !== null ? `${age} tahun` : "Belum diatur"}
                </p>
                <p>Kota: {watchedCity || user.city || "Belum diisi"}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">
                  Data internal dashboard
                </p>
                <p className="mt-2 break-words text-slate-600">
                  {watchedAddress || user.address || "Alamat internal belum diisi."}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Contact Info</p>
              <p className="mt-1">
                Email: {watchedContactEmail || user.contactEmail || "Belum diisi"}
              </p>
              <p>
                Telepon: {watchedPhoneNumber || user.phoneNumber || "Belum diisi"}
              </p>
              <p>
                Website:{" "}
                {normalizeSocialUrl(watchedWebsiteUrl || user.websiteUrl || "") ||
                  "Belum diisi"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {dictionary.publicPrimaryLinksTitle}
              </p>
              <CustomLinksList
                links={previewCustomLinks}
                emptyLabel={dictionary.profileCustomLinksEmpty}
              />
            </div>
            <ProfileRichText
              content={watchedBio}
              emptyLabel="Bio akan tampil di sini saat diisi."
            />
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Experience</p>
              <div className="mt-3">
                <ProfileRichText
                  content={watchedExperience}
                  emptyLabel="Experience akan tampil di sini saat diisi."
                />
              </div>
            </div>
            <SocialLinks
              websiteUrl={normalizeSocialUrl(watchedWebsiteUrl || user.websiteUrl || "")}
              instagramUrl={normalizeSocialUrl(
                watchedInstagram || user.instagramUrl || ""
              )}
              youtubeUrl={normalizeSocialUrl(
                watchedYoutube || user.youtubeUrl || ""
              )}
              facebookUrl={normalizeSocialUrl(
                watchedFacebook || user.facebookUrl || ""
              )}
              threadsUrl={normalizeSocialUrl(
                watchedThreads || user.threadsUrl || ""
              )}
            />
          </Card>
        </div>
      </div>
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



