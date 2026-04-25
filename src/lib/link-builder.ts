import { z } from "zod";
import {
  MAX_CUSTOM_LINKS_FREE_PLAN,
  MAX_LINK_DESCRIPTION_LENGTH,
  MAX_LINK_TITLE_LENGTH,
  normalizeCustomLinks,
  normalizeSocialUrl,
  type CustomLinkItem,
} from "@/lib/profile-utils";

export type LinkItem = CustomLinkItem;

export const LINK_BUILDER_MAX_ITEMS = MAX_CUSTOM_LINKS_FREE_PLAN;

export const linkCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Judul link wajib diisi.")
    .max(MAX_LINK_TITLE_LENGTH, `Judul maksimal ${MAX_LINK_TITLE_LENGTH} karakter.`),
  url: z
    .string()
    .trim()
    .max(300, "URL terlalu panjang.")
    .transform((value) => normalizeSocialUrl(value))
    .refine((value) => value.startsWith("http"), {
      message: "Masukkan URL yang valid.",
    }),
  description: z
    .string()
    .trim()
    .max(
      MAX_LINK_DESCRIPTION_LENGTH,
      `Deskripsi maksimal ${MAX_LINK_DESCRIPTION_LENGTH} karakter.`
    )
    .optional()
    .default(""),
  platform: z.string().trim().max(30, "Platform terlalu panjang.").optional().default(""),
  badge: z.string().trim().max(30, "Badge terlalu panjang.").optional().default(""),
  thumbnailUrl: z
    .string()
    .trim()
    .max(300, "URL thumbnail terlalu panjang.")
    .transform((value) => normalizeSocialUrl(value))
    .optional()
    .default(""),
  enabled: z.boolean().optional().default(true),
});

export const linkUpdateSchema = linkCreateSchema.extend({
  id: z.string().trim().min(1).max(80),
});

export const linkToggleSchema = z.object({
  enabled: z.boolean(),
});

export const linkReorderSchema = z.object({
  ids: z.array(z.string().trim().min(1).max(80)).min(1),
});

export function normalizeStoredLinks(value: unknown): LinkItem[] {
  return normalizeCustomLinks(value, LINK_BUILDER_MAX_ITEMS);
}

export function createLinkItem(
  payload: z.infer<typeof linkCreateSchema>,
  existing: LinkItem[]
): LinkItem {
  return {
    id: crypto.randomUUID(),
    title: payload.title.trim(),
    url: payload.url,
    description: payload.description?.trim() || undefined,
    platform: payload.platform?.trim() || undefined,
    badge: payload.badge?.trim() || undefined,
    thumbnailUrl: payload.thumbnailUrl || undefined,
    enabled: payload.enabled !== false,
    order: existing.length,
  };
}

export function normalizeOrder(links: LinkItem[]): LinkItem[] {
  return links.map((link, index) => ({
    ...link,
    order: index,
  }));
}
