import { z } from "zod";
import {
  MAX_CUSTOM_LINKS,
  MAX_LINK_DESCRIPTION_LENGTH,
  MAX_LINK_TITLE_LENGTH,
  normalizeCustomLinks,
  normalizeSocialUrl,
  type CustomLinkItem,
} from "@/lib/profile-utils";
import { buildFinalLink, validateBuiltLink } from "@/lib/add-link-url";

export type LinkItem = CustomLinkItem;

export const LINK_BUILDER_MAX_ITEMS = MAX_CUSTOM_LINKS;

const linkBaseSchema = z.object({
  type: z.string().trim().max(30, "Tipe block terlalu panjang.").optional().default("link"),
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
    .optional()
    .default(""),
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
  value: z.string().trim().max(500, "Value block terlalu panjang.").optional().default(""),
  style: z.string().trim().max(40, "Style block terlalu panjang.").optional().default(""),
  iconKey: z.string().trim().max(40, "Icon terlalu panjang.").optional().default(""),
  iconUrl: z
    .string()
    .trim()
    .max(300, "URL icon terlalu panjang.")
    .transform((value) => normalizeSocialUrl(value))
    .optional()
    .default(""),
  inputValue: z.string().trim().max(500, "Input terlalu panjang.").optional(),
  finalUrl: z
    .string()
    .trim()
    .max(500, "URL final terlalu panjang.")
    .transform((value) => (value ? normalizeSocialUrl(value) : ""))
    .optional(),
  inactiveReason: z.string().trim().max(80, "Alasan inactive terlalu panjang.").optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  enabled: z.boolean().optional().default(true),
});

function validateLinkUrl(
  value: z.infer<typeof linkBaseSchema>,
  ctx: z.RefinementCtx
) {
  const type = value.type || "link";
  const nonClickableBlock = ["divider", "text"].includes(type);
  if (nonClickableBlock) {
    return;
  }

  const built = buildFinalLink({
    linkType: type,
    platform: value.platform,
    label: value.title,
    inputValue: value.inputValue || value.value || value.url,
    url: value.url,
    subject: typeof value.metadata?.subject === "string" ? value.metadata.subject : "",
    body: typeof value.metadata?.body === "string" ? value.metadata.body : "",
    message: typeof value.metadata?.message === "string" ? value.metadata.message : "",
  });
  const validationError = validateBuiltLink(built);
  if (validationError) {
    ctx.addIssue({
      code: "custom",
      path: ["url"],
      message: validationError,
    });
  }
}

export const linkCreateSchema = linkBaseSchema.superRefine(validateLinkUrl);

export const linkUpdateSchema = linkBaseSchema.extend({
  id: z.string().trim().min(1).max(80),
  order: z.coerce.number().int().min(0).max(LINK_BUILDER_MAX_ITEMS).optional().default(0),
}).superRefine(validateLinkUrl);

export const linkToggleSchema = z.object({
  enabled: z.boolean(),
});

export const linkReorderSchema = z.object({
  ids: z.array(z.string().trim().min(1).max(80)).min(1),
});

export const linkDraftSchema = z.object({
  links: z.array(linkUpdateSchema).max(LINK_BUILDER_MAX_ITEMS),
});

export function normalizeStoredLinks(
  value: unknown,
  maxLinks: number = LINK_BUILDER_MAX_ITEMS
): LinkItem[] {
  return normalizeCustomLinks(value, maxLinks);
}

export function createLinkItem(
  payload: z.infer<typeof linkCreateSchema>,
  existing: LinkItem[]
): LinkItem {
  const built = buildFinalLink({
    linkType: payload.type,
    platform: payload.platform,
    label: payload.title,
    inputValue: payload.inputValue || payload.value || payload.url,
    url: payload.url,
    subject: typeof payload.metadata?.subject === "string" ? payload.metadata.subject : "",
    body: typeof payload.metadata?.body === "string" ? payload.metadata.body : "",
    message: typeof payload.metadata?.message === "string" ? payload.metadata.message : "",
  });

  return {
    id: crypto.randomUUID(),
    type: built.type || payload.type || "link",
    title: built.label.trim(),
    url: built.finalUrl || payload.url,
    value: built.inputValue || payload.value?.trim() || built.finalUrl || undefined,
    description: payload.description?.trim() || undefined,
    platform: built.platform || payload.platform?.trim() || undefined,
    badge: payload.badge?.trim() || undefined,
    thumbnailUrl: payload.thumbnailUrl || undefined,
    style: payload.style?.trim() || undefined,
    iconKey: payload.iconKey?.trim() || built.iconKey || undefined,
    iconUrl: payload.iconUrl || undefined,
    inputValue: built.inputValue || payload.inputValue || undefined,
    finalUrl: built.finalUrl || undefined,
    inactiveReason: payload.inactiveReason || undefined,
    metadata: {
      ...(payload.metadata || {}),
      platform_display_name: built.label,
      username: built.type === "social" ? built.inputValue : undefined,
      source: "manual_input",
    },
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

export function countActiveLinks(links: LinkItem[]): number {
  return links.reduce((total, link) => (link.enabled === false ? total : total + 1), 0);
}
