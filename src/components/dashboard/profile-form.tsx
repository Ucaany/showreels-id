"use client";

import { type ChangeEvent, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ImagePlus, List, Pilcrow } from "lucide-react";
import { AvatarBadge } from "@/components/avatar-badge";
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
  avatarUrl: z.string().optional(),
  coverImageUrl: z.string().optional(),
  bio: z.string().max(500, "Bio maksimal 500 karakter."),
  experience: z.string().max(700, "Pengalaman maksimal 700 karakter."),
  birthDate: z.string().optional(),
  city: z.string().max(120, "Kota terlalu panjang."),
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

export function ProfileForm({ user }: { user: DbUser }) {
  const router = useRouter();
  const { dictionary } = usePreferences();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverFileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user.name || "",
      username: user.username || "",
      avatarUrl: normalizeAvatarUrl(user.image || ""),
      coverImageUrl: normalizeAvatarUrl(user.coverImageUrl || ""),
      bio: user.bio || "",
      experience: user.experience || "",
      birthDate: user.birthDate || "",
      city: user.city || "",
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
  const watchedCover = useWatch({ control: form.control, name: "coverImageUrl" });
  const watchedUsername = useWatch({ control: form.control, name: "username" });
  const watchedBio = useWatch({ control: form.control, name: "bio" });
  const watchedExperience = useWatch({ control: form.control, name: "experience" });
  const watchedBirthDate = useWatch({ control: form.control, name: "birthDate" });
  const watchedCity = useWatch({ control: form.control, name: "city" });
  const watchedContactEmail = useWatch({ control: form.control, name: "contactEmail" });
  const watchedPhoneNumber = useWatch({ control: form.control, name: "phoneNumber" });
  const watchedWebsiteUrl = useWatch({ control: form.control, name: "websiteUrl" });
  const watchedInstagram = useWatch({ control: form.control, name: "instagramUrl" });
  const watchedYoutube = useWatch({ control: form.control, name: "youtubeUrl" });
  const watchedFacebook = useWatch({ control: form.control, name: "facebookUrl" });
  const watchedThreads = useWatch({ control: form.control, name: "threadsUrl" });
  const previewAvatar = normalizeAvatarUrl(watchedAvatar || "");
  const previewCover = normalizeAvatarUrl(watchedCover || "");
  const age = getAgeFromBirthDate(watchedBirthDate || user.birthDate || "");
  const publicProfileHref = `/creator/${watchedUsername || user.username}`;

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
    field: "avatarUrl" | "coverImageUrl",
    successMessage: string
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("File avatar harus berupa gambar.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 2MB.");
      return;
    }

    try {
      setError("");
      const dataUrl = await fileToDataUrl(file);
      form.setValue(field, dataUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setMessage(successMessage);
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
        avatarUrl: normalizeAvatarUrl(values.avatarUrl || ""),
        coverImageUrl: normalizeAvatarUrl(values.coverImageUrl || ""),
        bio: values.bio,
        experience: values.experience,
        birthDate: values.birthDate?.trim() || "",
        city: values.city.trim(),
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

    setMessage("Profil berhasil diperbarui.");
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
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="border-border bg-surface">
        <h1 className="font-display text-2xl font-semibold text-slate-900">
          {dictionary.editProfile}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {dictionary.profileWillShow}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
                  handleImageFieldChange(
                    event,
                    "coverImageUrl",
                    "Cover siap disimpan. Klik Simpan Perubahan."
                  )
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
                  <div className="absolute inset-0 flex items-end justify-between p-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                        Cover Preview
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {previewCover
                          ? "Cover detail creator akan tampil seperti ini."
                          : "Upload cover agar halaman detail creator terlihat lebih premium."}
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
                  Upload Cover
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
                    const normalized = normalizeAvatarUrl(event.target.value);
                    form.setValue("coverImageUrl", normalized, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  },
                })}
              />
              <p className="text-xs text-slate-600">
                Gunakan landscape image agar hasil cover lebih rapi di halaman detail.
              </p>
            </div>
          </div>

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
              Username
            </label>
            <Input {...form.register("username")} />
            <p className="mt-1 text-xs text-rose-600">
              {form.formState.errors.username?.message}
            </p>
          </div>

          <div>
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
                  handleImageFieldChange(
                    event,
                    "avatarUrl",
                    "Avatar siap disimpan. Klik Simpan Perubahan."
                  )
                }
              />
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4" />
                  Upload File
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
                    const normalized = normalizeAvatarUrl(event.target.value);
                    form.setValue("avatarUrl", normalized, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  },
                })}
              />
              <p className="text-xs text-slate-600">
                Bisa pakai file gambar langsung atau link Google Drive yang publik.
              </p>
            </div>
          </div>

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
            <p className="mt-1 text-xs text-slate-600">
              Boleh isi dengan emoji. Gunakan tombol di atas untuk membuat point atau paragraf baru lebih cepat.
            </p>
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
                onClick={() => appendTextBlock("experience", "paragraph")}
                aria-label="Tambah paragraf ke experience"
                title="Tambah paragraf"
              >
                <Pilcrow className="h-4 w-4" />
              </Button>
            </div>
            <Textarea {...form.register("experience")} />
            <p className="mt-1 text-xs text-slate-600">
              Emoji juga didukung di bagian pengalaman, termasuk format per point dan per paragraf.
            </p>
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
              <Input placeholder="Contoh: Yogyakarta" {...form.register("city")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email Contact (publik)
              </label>
              <Input placeholder="halo@namakamu.com" {...form.register("contactEmail")} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nomor Telepon
              </label>
              <Input placeholder="+62 812-xxxx-xxxx" {...form.register("phoneNumber")} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Website
              </label>
              <Input placeholder="https://portfolio-kamu.com" {...form.register("websiteUrl")} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Instagram
              </label>
              <Input placeholder="instagram.com/username" {...form.register("instagramUrl")} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                YouTube Channel
              </label>
              <Input placeholder="youtube.com/@channel" {...form.register("youtubeUrl")} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Facebook
              </label>
              <Input placeholder="facebook.com/username" {...form.register("facebookUrl")} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Threads
              </label>
              <Input placeholder="threads.net/@username" {...form.register("threadsUrl")} />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Skills
            </label>
            <Input {...form.register("skills")} />
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

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>

          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4">
            <p className="text-sm font-semibold text-rose-700">Hapus Akun</p>
            <p className="mt-1 text-sm text-rose-600">
              Aksi ini permanen. Semua video dan data profil akan dihapus.
            </p>
            <Button
              type="button"
              className="mt-3"
              variant="danger"
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
            >
              {deletingAccount ? "Menghapus akun..." : "Hapus Profile / Account"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="h-fit space-y-4 border-border bg-surface">
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
            <p className="text-sm text-slate-600">
              @{watchedUsername || user.username}
            </p>
            <p className="text-xs text-slate-600">
              {watchedCity || user.city || "Kota belum diisi"}
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-600">Umur: {age !== null ? `${age} tahun` : "Belum diatur"}</p>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Contact Info</p>
          <p className="mt-1">
            Email: {watchedContactEmail || user.contactEmail || "Belum diisi"}
          </p>
          <p>
            Telepon: {watchedPhoneNumber || user.phoneNumber || "Belum diisi"}
          </p>
          <p>
            Website: {normalizeSocialUrl(watchedWebsiteUrl || user.websiteUrl || "") || "Belum diisi"}
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
          instagramUrl={normalizeSocialUrl(watchedInstagram || user.instagramUrl || "")}
          youtubeUrl={normalizeSocialUrl(watchedYoutube || user.youtubeUrl || "")}
          facebookUrl={normalizeSocialUrl(watchedFacebook || user.facebookUrl || "")}
          threadsUrl={normalizeSocialUrl(watchedThreads || user.threadsUrl || "")}
        />
        <Link href={publicProfileHref}>
          <Button variant="secondary" className="w-full">
            Lihat Profil Publik
          </Button>
        </Link>
      </Card>
    </div>
  );
}

