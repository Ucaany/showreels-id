"use client";

import { type ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ImagePlus } from "lucide-react";
import { AvatarBadge } from "@/components/avatar-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { usePreferences } from "@/hooks/use-preferences";
import type { DbUser } from "@/db/schema";
import { normalizeAvatarUrl } from "@/lib/avatar-utils";

const schema = z.object({
  fullName: z.string().min(2, "Nama minimal 2 karakter."),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter.")
    .regex(/^[a-zA-Z0-9_]+$/, "Gunakan huruf, angka, atau underscore."),
  avatarUrl: z.string().optional(),
  bio: z.string().max(500, "Bio maksimal 500 karakter."),
  experience: z.string().max(700, "Pengalaman maksimal 700 karakter."),
  skills: z.string().max(300, "Skills terlalu panjang."),
});

type FormValues = z.infer<typeof schema>;

export function ProfileForm({ user }: { user: DbUser }) {
  const router = useRouter();
  const { dictionary } = usePreferences();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user.name || "",
      username: user.username || "",
      avatarUrl: normalizeAvatarUrl(user.image || ""),
      bio: user.bio || "",
      experience: user.experience || "",
      skills: user.skills.join(", "),
    },
  });

  const watchedName = useWatch({ control: form.control, name: "fullName" });
  const watchedAvatar = useWatch({ control: form.control, name: "avatarUrl" });
  const watchedUsername = useWatch({ control: form.control, name: "username" });
  const watchedBio = useWatch({ control: form.control, name: "bio" });
  const previewAvatar = normalizeAvatarUrl(watchedAvatar || "");

  const handleAvatarFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("File avatar harus berupa gambar.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Ukuran avatar maksimal 2MB.");
      return;
    }

    const fileToDataUrl = () =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Gagal membaca file avatar."));
        reader.readAsDataURL(file);
      });

    try {
      setError("");
      const dataUrl = await fileToDataUrl();
      form.setValue("avatarUrl", dataUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setMessage("Avatar file siap disimpan. Klik Simpan Perubahan.");
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Gagal membaca file avatar."
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
        bio: values.bio,
        experience: values.experience,
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
                onChange={handleAvatarFileChange}
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
            <Textarea {...form.register("bio")} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Experience
            </label>
            <Textarea {...form.register("experience")} />
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
        </form>
      </Card>

      <Card className="h-fit space-y-4 border-border bg-surface">
        <h2 className="font-display text-lg font-semibold text-slate-900">
          {dictionary.publicProfile}
        </h2>
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
          </div>
        </div>
        <p className="text-sm leading-relaxed text-slate-600">
          {watchedBio || "Bio akan tampil di sini saat diisi."}
        </p>
      </Card>
    </div>
  );
}

