"use client";

import { type ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import {
  Clapperboard,
  ImagePlus,
  LayoutTemplate,
  Link2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { MediaPreviewCarousel } from "@/components/media-preview-carousel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePreferences } from "@/hooks/use-preferences";
import {
  buildAiDescription,
  detectVideoSource,
  getAutoThumbnailFromVideoUrl,
  getVisibilityLabel,
  normalizeAssetUrl,
  parseMultilineUrls,
  slugifyText,
} from "@/lib/video-utils";
import type { VideoVisibility } from "@/lib/types";

const schema = z
  .object({
    title: z.string().min(4, "Judul minimal 4 karakter."),
    sourceUrl: z.url("Masukkan URL yang valid."),
    thumbnailUrl: z.string().optional(),
    extraVideoUrls: z.string().optional(),
    imageUrls: z.string().optional(),
    tags: z.string().optional(),
    visibility: z.enum(["draft", "private", "public"]),
    description: z.string().max(1500, "Deskripsi terlalu panjang.").optional(),
  })
  .refine((value) => detectVideoSource(value.sourceUrl) !== null, {
    path: ["sourceUrl"],
    message: "Gunakan URL YouTube, Google Drive, Instagram, atau Vimeo.",
  });

type FormValues = z.infer<typeof schema>;

interface VideoFormProps {
  mode?: "create" | "edit";
  initialVideo?: {
    id: string;
    title: string;
    sourceUrl: string;
    thumbnailUrl: string;
    extraVideoUrls: string[];
    imageUrls: string[];
    tags: string[];
    visibility: VideoVisibility;
    description: string;
    publicSlug: string;
  };
}

export function VideoForm({
  mode = "create",
  initialVideo,
}: VideoFormProps = {}) {
  const router = useRouter();
  const { dictionary } = usePreferences();
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const thumbnailFileRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialVideo?.title || "",
      sourceUrl: initialVideo?.sourceUrl || "",
      thumbnailUrl: initialVideo?.thumbnailUrl || "",
      extraVideoUrls: initialVideo?.extraVideoUrls.join("\n") || "",
      imageUrls: initialVideo?.imageUrls.join("\n") || "",
      tags: initialVideo?.tags.join(", ") || "",
      visibility: initialVideo?.visibility || "public",
      description: initialVideo?.description || "",
    },
  });

  const watchedTitle = useWatch({ control: form.control, name: "title" });
  const watchedSourceUrl = useWatch({ control: form.control, name: "sourceUrl" });
  const watchedThumbnailUrl = useWatch({ control: form.control, name: "thumbnailUrl" });
  const watchedExtraVideoUrls = useWatch({ control: form.control, name: "extraVideoUrls" });
  const watchedImageUrls = useWatch({ control: form.control, name: "imageUrls" });
  const watchedTags = useWatch({ control: form.control, name: "tags" });
  const watchedVisibility = useWatch({ control: form.control, name: "visibility" });
  const source = detectVideoSource(watchedSourceUrl || "");
  const manualThumbnailUrl = normalizeAssetUrl(watchedThumbnailUrl || "");
  const autoThumbnailUrl = getAutoThumbnailFromVideoUrl(watchedSourceUrl || "");
  const thumbnailPreview = manualThumbnailUrl || autoThumbnailUrl;
  const extraVideoPreview = parseMultilineUrls(watchedExtraVideoUrls || "");
  const imagePreview = parseMultilineUrls(watchedImageUrls || "");
  const galleryEnabled = Boolean(manualThumbnailUrl);
  const slugPreview =
    mode === "edit" && !watchedTitle?.trim()
      ? initialVideo?.publicSlug || "video-portofolio"
      : slugifyText(watchedTitle || initialVideo?.title || "video-portofolio");

  const handleGenerateDescription = async () => {
    setSubmitError("");
    const title = form.getValues("title");
    const sourceUrl = form.getValues("sourceUrl");
    const tags = (form.getValues("tags") || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const detectedSource = detectVideoSource(sourceUrl);

    if (!title || !detectedSource) {
      setSubmitError("Isi judul dan URL video yang valid dulu.");
      return;
    }

    setAiLoading(true);
    form.setValue(
      "description",
      buildAiDescription({ title, tags, source: detectedSource }),
      { shouldValidate: true }
    );
    setAiLoading(false);
  };

  const handleThumbnailFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setSubmitError("Thumbnail harus berupa file gambar.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setSubmitError("Ukuran thumbnail maksimal 3MB.");
      return;
    }

    const toDataUrl = () =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Gagal membaca file thumbnail."));
        reader.readAsDataURL(file);
      });

    try {
      setSubmitError("");
      const dataUrl = await toDataUrl();
      form.setValue("thumbnailUrl", dataUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch {
      setSubmitError("Gagal memproses file thumbnail.");
    } finally {
      event.target.value = "";
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError("");
    setSuccess("");

    const response = await fetch(
      mode === "edit" && initialVideo ? `/api/videos/${initialVideo.id}` : "/api/videos",
      {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          sourceUrl: values.sourceUrl,
          thumbnailUrl: normalizeAssetUrl(values.thumbnailUrl || ""),
          extraVideoUrls: parseMultilineUrls(values.extraVideoUrls || ""),
          imageUrls: parseMultilineUrls(values.imageUrls || ""),
          tags: (values.tags || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          visibility: values.visibility,
          description: values.description,
        }),
      }
    );

    const payload = (await response.json().catch(() => null)) as
      | { error?: string; video?: { publicSlug: string } }
      | null;

    if (!response.ok) {
      setSubmitError(payload?.error ?? "Gagal menyimpan video.");
      return;
    }

    if (mode === "edit") {
      setSuccess("Video berhasil diperbarui.");
      router.refresh();
      return;
    }

    setSuccess("Video berhasil disimpan.");
    router.push(
      values.visibility === "public"
        ? `/v/${payload?.video?.publicSlug ?? ""}`
        : "/dashboard"
    );
    router.refresh();
  });

  const handleDelete = async () => {
    if (mode !== "edit" || !initialVideo) {
      return;
    }

    const confirmed = window.confirm(
      "Yakin ingin menghapus video ini? Tindakan ini tidak bisa dibatalkan."
    );

    if (!confirmed) {
      return;
    }

    setDeleteLoading(true);
    setSubmitError("");
    setSuccess("");

    const response = await fetch(`/api/videos/${initialVideo.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      setSubmitError("Gagal menghapus video.");
      setDeleteLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="border-border bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_30%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(248,250,252,0.98))]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
              Video dashboard
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold text-slate-900">
              {mode === "edit" ? "Edit Video Portfolio" : dictionary.publishVideo}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {mode === "edit"
                ? "Perbarui detail video, thumbnail, dan tampilan publik yang akan dilihat client."
                : "Isi data video dengan urutan yang rapi, lalu cek preview sebelum disimpan."}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
            <p className="font-semibold text-slate-900">Status preview</p>
            <p className="mt-1 text-slate-600">
              {galleryEnabled
                ? "Slider aktif karena thumbnail manual sudah ditambahkan."
                : "Slider nonaktif. Sistem akan memakai thumbnail otomatis dari video utama."}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Clapperboard className="h-4 w-4 text-brand-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Informasi utama video
              </h2>
            </div>
            <div className="space-y-4">
              <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Judul Video
            </label>
            <Input {...form.register("title")} />
            <p className="mt-1 text-xs text-rose-600">
              {form.formState.errors.title?.message}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              URL Video
            </label>
            <Input
              placeholder="https://youtube.com/watch?v=..."
              {...form.register("sourceUrl")}
            />
            <p className="mt-1 text-xs text-rose-600">
              {form.formState.errors.sourceUrl?.message}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Gunakan link YouTube, Google Drive, Instagram Reel, atau Vimeo.
            </p>
          </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <LayoutTemplate className="h-4 w-4 text-brand-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Thumbnail & galeri
              </h2>
            </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Thumbnail (opsional)
            </label>
            <input
              ref={thumbnailFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleThumbnailFileChange}
            />
            <div className="mb-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => thumbnailFileRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" />
                Add File Thumbnail
              </Button>
              {thumbnailPreview ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    form.setValue("thumbnailUrl", "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                >
                  Hapus Thumbnail
                </Button>
              ) : null}
            </div>
            <Input
              placeholder="https://images.unsplash.com/..."
              {...form.register("thumbnailUrl")}
            />
            <p className="mt-1 text-xs text-slate-600">
              Upload file atau isi link. Jika thumbnail manual diisi, slide media akan aktif.
            </p>
            {!manualThumbnailUrl && source ? (
              <p className="mt-1 text-xs text-brand-700">
                Thumbnail otomatis diambil dari video utama dan slider dinonaktifkan.
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Video Tambahan (opsional)
            </label>
            <Textarea
              className="min-h-24"
              placeholder={"Satu URL per baris\nhttps://youtube.com/watch?v=...\nhttps://vimeo.com/..."}
              {...form.register("extraVideoUrls")}
            />
            <p className="mt-1 text-xs text-slate-600">
              Video tambahan hanya tampil sebagai slide saat thumbnail manual diaktifkan.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Gambar Tambahan (opsional)
            </label>
            <Textarea
              className="min-h-24"
              placeholder={"Satu URL gambar per baris\nhttps://.../shot-1.jpg\nhttps://.../shot-2.jpg"}
              {...form.register("imageUrls")}
            />
            <p className="mt-1 text-xs text-slate-600">
              Gambar tambahan ikut tampil di slide jika thumbnail manual tersedia.
            </p>
          </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-brand-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Detail publik
              </h2>
            </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Tags
            </label>
            <Input {...form.register("tags")} />
            <p className="mt-1 text-xs text-slate-600">
              Pisahkan tag dengan koma. Tag membantu deskripsi AI jadi lebih relevan.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Status Video
            </label>
            <Select {...form.register("visibility")}>
              <option value="draft">Draft - belum siap ditinjau klien</option>
              <option value="private">Private - hanya tersimpan di dashboard</option>
              <option value="public">Public - tampil di profil dan link publik</option>
            </Select>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-800">
                Deskripsi
              </label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={aiLoading}
              >
                <Sparkles className="h-4 w-4" />
                {aiLoading ? "Generating..." : "Generated with AI"}
              </Button>
            </div>
            <Textarea
              placeholder="Tulis ringkasan project, tujuan video, style editing, dan highlight hasil akhir."
              {...form.register("description")}
            />
            <p className="mt-1 text-xs text-slate-600">
              Gunakan tombol AI untuk membuat draft deskripsi yang lebih natural, lalu edit sesuai project.
            </p>
          </div>
          </div>

          {submitError ? (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {submitError}
            </p>
          ) : null}
          {success ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </p>
          ) : null}

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? "Menyimpan..."
              : mode === "edit"
                ? "Simpan Update"
                : dictionary.submitVideo}
          </Button>
        </form>
      </Card>

      <Card className="h-fit space-y-4 border-border bg-surface">
        <h2 className="font-display text-lg font-semibold text-slate-900">
          {dictionary.publicLinkReady}
        </h2>
        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          <p className="text-xs font-medium text-slate-600">Slug</p>
          <p className="mt-1 font-mono text-sm text-slate-800">
            /v/{slugPreview || "video-portofolio"}
          </p>
        </div>
        <p className="text-sm text-slate-700">
          Sumber terdeteksi: <span className="font-semibold">{source || "-"}</span>
        </p>
        <p className="text-sm text-slate-700">
          Tag saat ini: {watchedTags || "-"}
        </p>
        <p className="text-sm text-slate-700">
          Status saat ini:{" "}
          <span className="font-semibold">{getVisibilityLabel(watchedVisibility)}</span>
        </p>
        <p className="text-sm text-slate-600">
          Hanya video dengan status public yang muncul di landing page, profil creator,
          dan link `/v/[slug]`.
        </p>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Logika thumbnail</p>
          <ul className="mt-2 space-y-1 text-sm text-slate-600">
            <li>- Tanpa thumbnail manual: sistem pakai thumbnail bawaan video utama.</li>
            <li>- Dengan thumbnail manual: cover tampil dulu dan slider media aktif.</li>
          </ul>
        </div>
        <div className="space-y-3 border-t border-slate-200 pt-4">
          <p className="text-sm font-semibold text-slate-900">
            Preview Sebelum Submit
          </p>
          {source ? (
            <MediaPreviewCarousel
              manualThumbnailUrl={manualThumbnailUrl}
              fallbackThumbnailUrl={thumbnailPreview}
              mainVideoUrl={watchedSourceUrl || ""}
              extraVideoUrls={extraVideoPreview}
              imageUrls={imagePreview}
              title={watchedTitle || "Preview video"}
            />
          ) : (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
              Isi URL video utama dulu untuk melihat preview.
            </p>
          )}
        </div>
        {mode === "edit" && initialVideo ? (
          <div className="space-y-3 border-t border-slate-200 pt-4">
            <p className="text-sm font-semibold text-slate-900">Danger Zone</p>
            <Button
              type="button"
              variant="danger"
              className="w-full"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              <Trash2 className="h-4 w-4" />
              {deleteLoading ? "Menghapus..." : "Hapus Video"}
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
