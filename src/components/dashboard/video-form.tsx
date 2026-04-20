"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePreferences } from "@/hooks/use-preferences";
import {
  buildAiDescription,
  detectVideoSource,
  getVisibilityLabel,
  slugifyText,
} from "@/lib/video-utils";
import type { VideoVisibility } from "@/lib/types";

const schema = z
  .object({
    title: z.string().min(4, "Judul minimal 4 karakter."),
    sourceUrl: z.url("Masukkan URL yang valid."),
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

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialVideo?.title || "",
      sourceUrl: initialVideo?.sourceUrl || "",
      tags: initialVideo?.tags.join(", ") || "",
      visibility: initialVideo?.visibility || "public",
      description: initialVideo?.description || "",
    },
  });

  const watchedTitle = useWatch({ control: form.control, name: "title" });
  const watchedSourceUrl = useWatch({ control: form.control, name: "sourceUrl" });
  const watchedTags = useWatch({ control: form.control, name: "tags" });
  const watchedVisibility = useWatch({ control: form.control, name: "visibility" });
  const source = detectVideoSource(watchedSourceUrl || "");
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
      <Card className="border-border bg-surface">
        <h1 className="font-display text-2xl font-semibold text-slate-900">
          {mode === "edit" ? "Edit Video Portfolio" : dictionary.publishVideo}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {mode === "edit"
            ? "Perbarui detail video, link sumber, dan public page yang tampil ke klien."
            : "Simpan video ke database dan hasilkan public page yang bisa dibagikan."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-800">
              Tags
            </label>
            <Input {...form.register("tags")} />
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
                {aiLoading ? "Generating..." : "Generate AI"}
              </Button>
            </div>
            <Textarea {...form.register("description")} />
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
