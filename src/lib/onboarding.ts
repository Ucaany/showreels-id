import { z } from "zod";
import {
  isReservedUsername,
  isUsernameFormatValid,
  sanitizeUsername,
} from "@/lib/username-rules";
import { normalizeSocialUrl } from "@/lib/profile-utils";

function normalizeOptionalText(input: unknown) {
  if (typeof input !== "string") {
    return "";
  }
  return input.trim();
}

const roleSchema = z.preprocess(
  normalizeOptionalText,
  z.string().max(120, "Role terlalu panjang.").default("")
);

const bioSchema = z.preprocess(
  normalizeOptionalText,
  z.string().max(240, "Bio terlalu panjang.").default("")
);

const imageUrlSchema = z.preprocess(
  normalizeOptionalText,
  z.string().max(300, "URL gambar terlalu panjang.").default("")
);

export const onboardingProfileSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "Nama wajib diisi.")
      .max(120, "Nama maksimal 120 karakter."),
    username: z
      .string()
      .trim()
      .transform((value) => sanitizeUsername(value))
      .refine((value) => value.length >= 3, {
        message: "Username minimal 3 karakter.",
      })
      .refine((value) => isUsernameFormatValid(value) && !isReservedUsername(value), {
        message: "Username tidak valid.",
      }),
    role: roleSchema,
    bio: bioSchema,
    image: imageUrlSchema,
    coverImageUrl: imageUrlSchema,
  })
  .partial();

export const onboardingFirstLinkSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Judul link wajib diisi.")
    .max(60, "Judul link maksimal 60 karakter."),
  url: z
    .string()
    .trim()
    .max(300, "URL terlalu panjang.")
    .transform((value) => normalizeSocialUrl(value))
    .refine((value) => value.startsWith("http"), {
      message: "URL wajib diisi untuk link ini.",
    }),
  platform: z.preprocess(
    normalizeOptionalText,
    z.string().max(40, "Platform terlalu panjang.").default("")
  ),
  enabled: z.boolean().optional().default(true),
});

export const onboardingProgressSchema = z.object({
  currentStep: z.coerce.number().int().min(1).max(4).optional(),
  profile: onboardingProfileSchema.optional(),
  firstLink: onboardingFirstLinkSchema.optional(),
  links: z.array(onboardingFirstLinkSchema).max(12, "Maksimal 12 link saat onboarding.").optional(),
  createFirstLink: z.boolean().optional().default(false),
  wantsToAddFirstLink: z.boolean().optional(),
  progressPayload: z.record(z.string(), z.unknown()).optional(),
});

export const onboardingCompleteSchema = z.object({
  firstVideoUploaded: z.boolean().optional().default(false),
  goTo: z.enum(["dashboard", "build-link"]).optional().default("dashboard"),
});

export const onboardingSkipSchema = z.object({
  reason: z.string().trim().max(120).optional().default("fill_later"),
});
