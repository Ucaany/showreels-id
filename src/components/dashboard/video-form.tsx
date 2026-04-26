"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import {
  Clapperboard,
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
import { confirmFeedbackAction, showFeedbackAlert } from "@/lib/feedback-alert";
import {
  buildAiDescription,
  detectVideoSource,
  getAutoThumbnailFromVideoUrl,
  getVisibilityLabel,
  normalizeAssetUrl,
  parseMultilineUrls,
  slugifyText,
} from "@/lib/video-utils";
import type { VideoAspectRatio, VideoVisibility } from "@/lib/types";

function formatDurationLabel(seconds: number): string {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

async function detectDurationFromVideoUrl(url: string): Promise<string | null> {
  const normalizedUrl = url.trim();
  if (!normalizedUrl) {
    return null;
  }

  // Metadata duration detection only works for direct media URLs the browser can read.
  const looksLikeDirectMedia = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(normalizedUrl);
  if (!looksLikeDirectMedia) {
    return null;
  }

  return new Promise((resolve) => {
    const media = document.createElement("video");
    let settled = false;

    const finalize = (value: string | null) => {
      if (settled) {
        return;
      }
      settled = true;
      media.src = "";
      resolve(value);
    };

    const timer = window.setTimeout(() => finalize(null), 6000);
    media.preload = "metadata";
    media.crossOrigin = "anonymous";
    media.onloadedmetadata = () => {
      window.clearTimeout(timer);
      if (!Number.isFinite(media.duration) || media.duration <= 0) {
        finalize(null);
        return;
      }
      finalize(formatDurationLabel(media.duration));
    };
    media.onerror = () => {
      window.clearTimeout(timer);
      finalize(null);
    };
    media.src = normalizedUrl;
  });
}

const schema = z
  .object({
    title: z.string().min(4, "Judul minimal 4 karakter."),
    sourceUrl: z.url("Masukkan URL yang valid."),
    aspectRatio: z.enum(["landscape", "portrait"]),
    outputType: z.string().max(80, "Output terlalu panjang.").optional(),
    durationLabel: z.string().max(30, "Durasi terlalu panjang.").optional(),
    thumbnailUrl: z
      .string()
      .optional()
      .refine((value) => !String(value || "").toLowerCase().startsWith("data:"), {
        message: "Upload file langsung tidak didukung. Gunakan URL thumbnail.",
      })
      .refine((value) => !value || normalizeAssetUrl(value).startsWith("http"), {
        message: "Gunakan URL thumbnail http/https yang valid.",
      }),
    extraVideoUrls: z.string().optional(),
    imageUrls: z.string().optional(),
    tags: z.string().optional(),
    visibility: z.enum(["draft", "private", "semi_private", "public"]),
    description: z.string().max(1500, "Deskripsi terlalu panjang.").optional(),
  })
  .refine((value) => detectVideoSource(value.sourceUrl) !== null, {
    path: ["sourceUrl"],
    message: "Gunakan URL YouTube, Google Drive, Instagram, Facebook, atau Vimeo.",
  });

type FormValues = z.infer<typeof schema>;

interface VideoFormProps {
  mode?: "create" | "edit";
  customThumbnailEnabled?: boolean;
  initialVideo?: {
    id: string;
    title: string;
    sourceUrl: string;
    aspectRatio: VideoAspectRatio;
    outputType: string;
    durationLabel: string;
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
  customThumbnailEnabled = true,
  initialVideo,
}: VideoFormProps = {}) {
  const router = useRouter();
  const { dictionary } = usePreferences();
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [autoSaveInfo, setAutoSaveInfo] = useState("Draft otomatis aktif.");
  const [durationInfo, setDurationInfo] = useState("");
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storageKey = useMemo(
    () =>
      mode === "edit" && initialVideo
        ? `video-form-draft:${initialVideo.id}`
        : "video-form-draft:create",
    [initialVideo, mode]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialVideo?.title || "",
      sourceUrl: initialVideo?.sourceUrl || "",
      aspectRatio: initialVideo?.aspectRatio || "landscape",
      outputType: initialVideo?.outputType || "",
      durationLabel: initialVideo?.durationLabel || "",
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
  const watchedAspectRatio = useWatch({
    control: form.control,
    name: "aspectRatio",
  });
  const watchedOutputType = useWatch({
    control: form.control,
    name: "outputType",
  });
  const watchedDurationLabel = useWatch({
    control: form.control,
    name: "durationLabel",
  });
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
      ? initialVideo?.publicSlug || "showreels-portofolio"
      : slugifyText(watchedTitle || initialVideo?.title || "showreels-portofolio");

  useEffect(() => {
    if (mode !== "create") {
      return;
    }

    const rawDraft = window.localStorage.getItem(storageKey);
    if (!rawDraft) {
      return;
    }

    try {
      const parsed = JSON.parse(rawDraft) as Partial<FormValues>;
      form.reset(
        {
          title: parsed.title || "",
          sourceUrl: parsed.sourceUrl || "",
          aspectRatio: parsed.aspectRatio || "landscape",
          outputType: parsed.outputType || "",
          durationLabel: parsed.durationLabel || "",
          thumbnailUrl: parsed.thumbnailUrl || "",
          extraVideoUrls: parsed.extraVideoUrls || "",
          imageUrls: parsed.imageUrls || "",
          tags: parsed.tags || "",
          visibility: parsed.visibility || "public",
          description: parsed.description || "",
        },
        { keepDirty: false }
      );
    } catch {}
  }, [form, mode, storageKey]);

  useEffect(() => {
    if (!customThumbnailEnabled && form.getValues("thumbnailUrl")) {
      form.setValue("thumbnailUrl", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [customThumbnailEnabled, form]);

  useEffect(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    const savingTimer = setTimeout(() => {
      setAutoSaveInfo("Menyimpan draft...");
    }, 0);

    autosaveTimerRef.current = setTimeout(() => {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          title: watchedTitle || "",
          sourceUrl: watchedSourceUrl || "",
          aspectRatio: watchedAspectRatio || "landscape",
          outputType: watchedOutputType || "",
          durationLabel: watchedDurationLabel || "",
          thumbnailUrl: watchedThumbnailUrl || "",
          extraVideoUrls: watchedExtraVideoUrls || "",
          imageUrls: watchedImageUrls || "",
          tags: watchedTags || "",
          visibility: watchedVisibility || "public",
          description: form.getValues("description") || "",
        })
      );
      setAutoSaveInfo("Draft otomatis tersimpan.");
    }, 700);

    return () => {
      clearTimeout(savingTimer);
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [
    form,
    storageKey,
    watchedExtraVideoUrls,
    watchedAspectRatio,
    watchedOutputType,
    watchedDurationLabel,
    watchedImageUrls,
    watchedSourceUrl,
    watchedTags,
    watchedThumbnailUrl,
    watchedTitle,
    watchedVisibility,
  ]);

  useEffect(() => {
    const url = (watchedSourceUrl || "").trim();
    if (!url || (watchedDurationLabel || "").trim().length > 0) {
      return;
    }

    let cancelled = false;
    const run = async () => {
      const detectedDuration = await detectDurationFromVideoUrl(url);
      if (cancelled) {
        return;
      }
      if (!detectedDuration) {
        return;
      }
      form.setValue("durationLabel", detectedDuration, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setDurationInfo(`Durasi terdeteksi: ${detectedDuration}`);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [form, watchedDurationLabel, watchedSourceUrl]);

  const durationHelperText = (() => {
    if (durationInfo) {
      return durationInfo;
    }
    if (!(watchedSourceUrl || "").trim()) {
      return "Durasi otomatis akan dicoba saat URL video diisi.";
    }
    if ((watchedDurationLabel || "").trim().length > 0) {
      return "Durasi manual aktif. Klik deteksi otomatis jika ingin cek ulang.";
    }
    return "Durasi otomatis tidak tersedia, isi durasi manual.";
  })();

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
      await showFeedbackAlert({
        title: "Data belum lengkap",
        text: "Isi judul dan URL video yang valid dulu.",
        icon: "warning",
      });
      return;
    }

    setAiLoading(true);
    form.setValue(
      "description",
      buildAiDescription({ title, tags, source: detectedSource }),
      { shouldValidate: true }
    );
    setAiLoading(false);
    await showFeedbackAlert({
      title: "Draft deskripsi AI siap",
      text: "Silakan review lalu sesuaikan dengan kebutuhan project.",
      icon: "success",
      timer: 1200,
    });
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
          aspectRatio: values.aspectRatio,
          outputType: values.outputType?.trim() || "",
          durationLabel: values.durationLabel?.trim() || "",
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
      await showFeedbackAlert({
        title: "Gagal menyimpan video",
        text: payload?.error ?? "Coba lagi dalam beberapa saat.",
        icon: "error",
      });
      return;
    }

    if (mode === "edit") {
      await showFeedbackAlert({
        title: "Video berhasil diperbarui",
        icon: "success",
        timer: 1200,
      });
      router.refresh();
      return;
    }

    await showFeedbackAlert({
      title: "Video berhasil disimpan",
      icon: "success",
      timer: 1200,
    });
    window.localStorage.removeItem(storageKey);
    router.push(
      values.visibility === "public" || values.visibility === "semi_private"
        ? `/v/${payload?.video?.publicSlug ?? ""}`
        : "/dashboard"
    );
    router.refresh();
  });

  const handleDelete = async () => {
    if (mode !== "edit" || !initialVideo) {
      return;
    }

    const confirmed = await confirmFeedbackAction({
      title: "Hapus video ini?",
      text: "Tindakan ini tidak bisa dibatalkan.",
      confirmButtonText: "Hapus",
      icon: "warning",
    });

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
      await showFeedbackAlert({
        title: "Gagal menghapus video",
        text: "Coba lagi dalam beberapa saat.",
        icon: "error",
      });
      setDeleteLoading(false);
      return;
    }

    await showFeedbackAlert({
      title: "Video berhasil dihapus",
      icon: "success",
      timer: 1000,
    });
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
            <p className="mt-1 text-xs font-medium text-slate-500">{autoSaveInfo}</p>
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
              Gunakan link YouTube, Google Drive, Instagram, Facebook, atau Vimeo.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800">
                Bentuk Video
              </label>
              <Select {...form.register("aspectRatio")}>
                <option value="landscape">Landscape (16:9)</option>
                <option value="portrait">Portrait (9:16)</option>
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-800">
                Output
              </label>
              <Input
                list="video-output-type"
                placeholder="Awareness, Reels, Film, Event..."
                {...form.register("outputType")}
              />
              <datalist id="video-output-type">
                <option value="Awareness" />
                <option value="Reels" />
                <option value="Film" />
                <option value="Event" />
                <option value="Commercial" />
              </datalist>
            </div>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="block text-sm font-medium text-slate-800">
                Durasi
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const url = (form.getValues("sourceUrl") || "").trim();
                  if (!url) {
                    setDurationInfo("Isi URL video dulu sebelum deteksi durasi.");
                    return;
                  }
                  setDurationInfo("Mencoba deteksi durasi otomatis...");
                  const detectedDuration = await detectDurationFromVideoUrl(url);
                  if (!detectedDuration) {
                    setDurationInfo("Durasi otomatis tidak tersedia, isi durasi manual.");
                    return;
                  }
                  form.setValue("durationLabel", detectedDuration, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setDurationInfo(`Durasi terdeteksi: ${detectedDuration}`);
                }}
              >
                Deteksi Otomatis
              </Button>
            </div>
            <Input
              placeholder="Contoh: 01:30"
              {...form.register("durationLabel")}
            />
            <p className="mt-1 text-xs text-slate-600">{durationHelperText}</p>
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
            <div className="mb-3 flex flex-wrap gap-2">
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
              disabled={!customThumbnailEnabled}
              placeholder="https://images.unsplash.com/..."
              {...form.register("thumbnailUrl")}
            />
            <p className="mt-1 text-xs text-rose-600">
              {form.formState.errors.thumbnailUrl?.message}
            </p>
            {customThumbnailEnabled ? (
              <p className="mt-1 text-xs text-slate-600">
                Isi URL thumbnail publik (http/https). Jika diisi, slide media akan aktif.
              </p>
            ) : (
              <p className="mt-1 text-xs text-amber-700">
                Custom thumbnail terkunci di plan Free. Upgrade ke Creator/Business untuk mengaktifkan.
              </p>
            )}
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
            <div className="space-y-4">
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
                  <option value="semi_private">Semi Private - hanya yang punya link</option>
                  <option value="public">Public - tampil di profil dan link publik</option>
                </Select>
              </div>

              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-slate-800">
                    Deskripsi
                  </label>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-full border border-brand-200 bg-gradient-to-r from-brand-50 to-white px-4 text-brand-700 hover:from-brand-100 hover:to-brand-50"
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
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            Link publik
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold text-slate-900">
            {dictionary.publicLinkReady}
          </h2>
        </div>
        <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
          <p className="text-xs font-medium text-slate-500">Slug</p>
          <p className="mt-1 truncate font-mono text-sm text-slate-900">
            /v/{slugPreview || "showreels-portofolio"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-xs font-medium text-slate-500">Sumber</p>
            <p className="mt-1 font-semibold text-slate-900">{source || "-"}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-xs font-medium text-slate-500">Status</p>
            <p className="mt-1 font-semibold text-slate-900">
              {getVisibilityLabel(watchedVisibility)}
            </p>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-slate-500">
          Thumbnail otomatis dipakai jika cover manual kosong.
        </p>
        <div className="space-y-3 border-t border-slate-200 pt-4">
          <p className="text-sm font-semibold text-slate-900">Preview</p>
          {source ? (
            <MediaPreviewCarousel
              manualThumbnailUrl={manualThumbnailUrl}
              fallbackThumbnailUrl={thumbnailPreview}
              mainVideoUrl={watchedSourceUrl || ""}
              extraVideoUrls={extraVideoPreview}
              imageUrls={imagePreview}
              title={watchedTitle || "Preview video"}
              aspectRatio={watchedAspectRatio || "landscape"}
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
