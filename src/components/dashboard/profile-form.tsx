"use client";

import { type ChangeEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import {
  CalendarClock,
  Home,
  ImagePlus,
  List,
  MapPinHouse,
  Settings2,
  Pilcrow,
  ShieldAlert,
  Sparkles,
  Video,
  UserRound,
  UserRoundPen,
} from "lucide-react";
import { AvatarBadge } from "@/components/avatar-badge";
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
import { getAgeFromBirthDate, normalizeSocialUrl } from "@/lib/profile-utils";

const schema = z.object({
  fullName: z.string().min(2, "Nama minimal 2 karakter."),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter.")
    .regex(/^[a-zA-Z0-9_]+$/, "Gunakan huruf, angka, atau underscore."),
  role: z.string().max(120, "Role terlalu panjang."),
  avatarUrl: z.string().optional(),
  coverImageUrl: z.string().optional(),
  bio: z.string().max(500, "Bio maksimal 500 karakter."),
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
  skills: z.string().max(300, "Skills terlalu panjang."),
});

type FormValues = z.infer<typeof schema>;

type CropTarget =
  | {
      field: "avatarUrl";
      src: string;
      title: string;
      aspectRatio: number;
      shape: "circle";
    }
  | {
      field: "coverImageUrl";
      src: string;
      title: string;
      aspectRatio: number;
      shape: "rect";
    };

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
  return <p className="mt-1 text-xs text-slate-500">{children}</p>;
}

export function ProfileForm({ user }: { user: DbUser }) {
  const router = useRouter();
  const { dictionary } = usePreferences();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user.name || "",
      username: user.username || "",
      role: user.role || "",
      avatarUrl: normalizeAvatarUrl(user.image || ""),
      coverImageUrl: normalizeAvatarUrl(user.coverImageUrl || ""),
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
      skills: user.skills.join(", "),
    },
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

  const previewAvatar = normalizeAvatarUrl(watchedAvatar || "");
  const previewCover = normalizeAvatarUrl(watchedCover || "");
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

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Gagal membaca file gambar."));
      reader.readAsDataURL(file);
    });

  const handleImageFieldChange = async (
    event: ChangeEvent<HTMLInputElement>,
    config: {
      field: "avatarUrl" | "coverImageUrl";
      title: string;
      aspectRatio: number;
      shape: "circle" | "rect";
    }
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 4MB.");
      return;
    }

    try {
      setError("");
      setMessage("");
      const dataUrl = await fileToDataUrl(file);
      if (config.field === "avatarUrl") {
        setCropTarget({
          field: "avatarUrl",
          src: dataUrl,
          title: config.title,
          aspectRatio: config.aspectRatio,
          shape: "circle",
        });
      } else {
        setCropTarget({
          field: "coverImageUrl",
          src: dataUrl,
          title: config.title,
          aspectRatio: config.aspectRatio,
          shape: "rect",
        });
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Gagal membaca file gambar."
      );
    } finally {
      event.target.value = "";
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setMessage("");
    setError("");

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
        skills: values.skills
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      }),
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

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Yakin ingin menghapus akun secara permanen? Semua data profil dan video akan ikut terhapus."
    );
    if (!confirmed) {
      return;
    }

    setDeletingAccount(true);
    setError("");
    setMessage("");

    const response = await fetch("/api/profile", {
      method: "DELETE",
    });

    if (!response.ok) {
      setError("Gagal menghapus akun. Coba lagi.");
      setDeletingAccount(false);
      return;
    }

    await signOut({ callbackUrl: "/" });
  };

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <Card className="overflow-hidden border-border bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))] p-0">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
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
                  <div className="hidden flex-wrap items-center gap-2 lg:flex">
                    <Link href="/dashboard">
                      <Button variant="secondary" size="sm">
                        <Home className="h-4 w-4" />
                        {dictionary.dashboard}
                      </Button>
                    </Link>
                    <Link href="/dashboard/profile">
                      <Button size="sm">
                        <UserRound className="h-4 w-4" />
                        {dictionary.profile}
                      </Button>
                    </Link>
                    <Link href="/dashboard/videos/new">
                      <Button variant="secondary" size="sm">
                        <Video className="h-4 w-4" />
                        {dictionary.submitVideo}
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSettingsOpen((prev) => !prev)}
                    >
                      <Settings2 className="h-4 w-4" />
                      Settings
                    </Button>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[280px]">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                    <p className="font-semibold text-slate-900">Quota username</p>
                    <p className="mt-1">
                      {usernameQuota.willConsume
                        ? `Sisa ${usernameQuota.remaining} perubahan lagi di periode ini.`
                        : `Sisa ${usernameQuota.remaining} perubahan di periode aktif.`}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Maksimal {USERNAME_MAX_CHANGES} kali per{" "}
                      {USERNAME_WINDOW_DAYS} hari.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setSettingsOpen((prev) => !prev)}
                  >
                    <Settings2 className="h-4 w-4" />
                    Settings
                  </Button>
                </div>
              </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-5 px-5 py-5 sm:px-6">
              {settingsOpen ? (
                <div className="rounded-2xl border border-rose-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(255,241,242,0.96))] p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-2xl">
                      <div className="mb-2 flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-rose-600" />
                        <h2 className="text-base font-semibold text-slate-950">
                          Settings akun
                        </h2>
                      </div>
                      <p className="text-sm leading-relaxed text-slate-600">
                        Pisahkan pengaturan sensitif dari form utama supaya area
                        edit profil tetap lebih fokus dan mudah dibaca.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSettingsOpen(false)}
                    >
                      Tutup
                    </Button>
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start gap-3">
                        <CalendarClock className="mt-0.5 h-5 w-5 text-brand-600" />
                        <div>
                          <p className="font-semibold text-slate-900">
                            Batas perubahan username
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-slate-600">
                            Demi kestabilan link publik dan pencarian client,
                            username hanya dapat berubah maksimal{" "}
                            {USERNAME_MAX_CHANGES} kali dalam{" "}
                            {USERNAME_WINDOW_DAYS} hari.
                          </p>
                          <p className="mt-2 text-sm font-medium text-slate-700">
                            {usernameQuota.resetLabel
                              ? `Reset periode: ${usernameQuota.resetLabel}`
                              : "Periode reset akan dibuat saat kamu mengganti username pertama kali."}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
                      <p className="text-sm font-semibold text-rose-700">
                        Hapus akun
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-rose-600">
                        Aksi ini permanen. Semua video, profil, dan data creator
                        akan ikut terhapus.
                      </p>
                      <Button
                        type="button"
                        className="mt-4 w-full"
                        variant="danger"
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount}
                      >
                        {deletingAccount
                          ? "Menghapus akun..."
                          : "Hapus Profile / Account"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
                      <input
                        ref={coverFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) =>
                          handleImageFieldChange(event, {
                            field: "coverImageUrl",
                            title: "Crop cover creator",
                            aspectRatio: 16 / 6,
                            shape: "rect",
                          })
                        }
                      />
                      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.20),_transparent_38%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(219,234,254,0.86))]">
                        <div
                          className="relative h-40 w-full"
                          style={
                            previewCover
                              ? {
                                  backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.08), rgba(15,23,42,0.22)), url(${previewCover})`,
                                  backgroundPosition: "center",
                                  backgroundRepeat: "no-repeat",
                                  backgroundSize: "cover",
                                }
                              : undefined
                          }
                        >
                          <div className="absolute inset-0 flex items-end justify-between gap-4 p-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                                Cover Preview
                              </p>
                              <p className="mt-2 text-sm text-slate-700">
                                {previewCover
                                  ? "Cover halaman creator akan memakai rasio yang sudah dirapikan."
                                  : "Upload cover landscape agar halaman detail creator terasa premium."}
                              </p>
                            </div>
                            <AvatarBadge
                              name={watchedName || user.name || "Creator"}
                              avatarUrl={previewAvatar}
                              size="lg"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => coverFileInputRef.current?.click()}
                        >
                          <ImagePlus className="h-4 w-4" />
                          Upload & Crop Cover
                        </Button>
                        {previewCover ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              form.setValue("coverImageUrl", "", {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
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
                            form.setValue("coverImageUrl", normalized, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          },
                        })}
                      />
                      <FieldHint>
                        Upload file akan membuka cropper otomatis sebelum gambar
                        dipakai.
                      </FieldHint>
                    </div>
                  </div>

                  <div className="mt-5">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Avatar Profil
                    </label>
                    <div className="space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) =>
                          handleImageFieldChange(event, {
                            field: "avatarUrl",
                            title: "Crop avatar profil",
                            aspectRatio: 1,
                            shape: "circle",
                          })
                        }
                      />
                      <div className="flex flex-wrap gap-3">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <ImagePlus className="h-4 w-4" />
                          Upload & Crop Avatar
                        </Button>
                        {previewAvatar ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              form.setValue("avatarUrl", "", {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
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
                            form.setValue("avatarUrl", normalized, {
                              shouldDirty: true,
                              shouldValidate: true,
                            });
                          },
                        })}
                      />
                      <FieldHint>
                        Avatar file akan dipotong ke rasio persegi agar
                        konsisten di seluruh halaman.
                      </FieldHint>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

      {cropTarget ? (
        <ImageCropDialog
          key={`${cropTarget.field}-${cropTarget.src.slice(0, 48)}`}
          open
          aspectRatio={cropTarget.aspectRatio}
          imageSrc={cropTarget.src}
          shape={cropTarget.shape}
          title={cropTarget.title}
          onCancel={() => setCropTarget(null)}
          onConfirm={(croppedImage) => {
            form.setValue(cropTarget.field, croppedImage, {
              shouldDirty: true,
              shouldValidate: true,
            });
            setCropTarget(null);
            setMessage(
              cropTarget.field === "avatarUrl"
                ? "Avatar berhasil dicrop. Klik Simpan Perubahan untuk menyimpan."
                : "Cover berhasil dicrop. Klik Simpan Perubahan untuk menyimpan."
            );
          }}
        />
      ) : null}
    </>
  );
}
