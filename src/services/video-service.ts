import { createId, simulateDelay } from "@/lib/helpers";
import type {
  ServiceResult,
  VideoItem,
  VideoSource,
  VideoVisibility,
} from "@/lib/types";
import {
  createPublicSlug,
  detectVideoSource,
  getSourceLabel,
} from "@/lib/video-utils";

export interface CreateVideoInput {
  userId: string;
  title: string;
  sourceUrl: string;
  tags: string[];
  visibility: VideoVisibility;
  thumbnailUrl?: string;
  extraVideoUrls?: string[];
  imageUrls?: string[];
  description?: string;
}

interface GenerateDescriptionInput {
  title: string;
  tags: string[];
  source: VideoSource;
}

export const videoService = {
  async createVideo(
    input: CreateVideoInput,
    videos: VideoItem[]
  ): Promise<ServiceResult<{ videos: VideoItem[]; video: VideoItem }>> {
    await simulateDelay(700);

    const source = detectVideoSource(input.sourceUrl);
    if (!source) {
      return {
        ok: false,
        error:
          "URL belum didukung. Gunakan link YouTube, Google Drive, Instagram, atau Vimeo.",
      };
    }

    const allSlugs = videos.map((video) => video.publicSlug);
    const publicSlug = createPublicSlug(input.title, allSlugs);
    const normalizedTags = input.tags.map((tag) => tag.trim()).filter(Boolean);

    const video: VideoItem = {
      id: createId("vid"),
      userId: input.userId,
      title: input.title.trim(),
      description:
        input.description?.trim() ||
        this.buildDescription({
          title: input.title.trim(),
          tags: normalizedTags,
          source,
        }),
      tags: normalizedTags,
      visibility: input.visibility,
      thumbnailUrl: input.thumbnailUrl?.trim() || "",
      extraVideoUrls: input.extraVideoUrls || [],
      imageUrls: input.imageUrls || [],
      sourceUrl: input.sourceUrl.trim(),
      source,
      publicSlug,
      createdAt: new Date().toISOString(),
    };

    return {
      ok: true,
      data: {
        videos: [video, ...videos],
        video,
      },
    };
  },

  async generateDescription(
    payload: GenerateDescriptionInput
  ): Promise<ServiceResult<{ description: string }>> {
    await simulateDelay(600);

    return {
      ok: true,
      data: {
        description: this.buildDescription(payload),
      },
    };
  },

  buildDescription(payload: GenerateDescriptionInput): string {
    const tagsLine = payload.tags.length
      ? `Tag utama: ${payload.tags.join(", ")}.`
      : "Tag utama akan diperbarui sesuai kebutuhan campaign.";

    return `Video "${payload.title}" menampilkan hasil karya dengan sumber ${getSourceLabel(
      payload.source
    )}. Fokus utama ada pada penyampaian cerita yang ringkas, ritme visual yang konsisten, dan kualitas output siap publish. ${tagsLine}`;
  },
};
