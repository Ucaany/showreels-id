import { z } from "zod";
import {
  isReservedUsername,
  isUsernameFormatValid,
  sanitizeUsername,
} from "@/lib/username-rules";
import { normalizeSocialUrl } from "@/lib/profile-utils";

export const onboardingProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    username: z
      .string()
      .trim()
      .transform((value) => sanitizeUsername(value))
      .refine((value) => isUsernameFormatValid(value) && !isReservedUsername(value), {
        message: "Username tidak valid.",
      }),
    role: z.string().trim().max(120).optional().default(""),
    bio: z.string().trim().max(240).optional().default(""),
    image: z.string().trim().max(300).optional().default(""),
    coverImageUrl: z.string().trim().max(300).optional().default(""),
  })
  .partial();

export const onboardingFirstLinkSchema = z.object({
  title: z.string().trim().min(1).max(60),
  url: z
    .string()
    .trim()
    .max(300)
    .transform((value) => normalizeSocialUrl(value))
    .refine((value) => value.startsWith("http"), {
      message: "URL tidak valid.",
    }),
  platform: z.string().trim().max(40).optional().default(""),
  enabled: z.boolean().optional().default(true),
});

export const onboardingProgressSchema = z.object({
  currentStep: z.coerce.number().int().min(1).max(4).optional(),
  profile: onboardingProfileSchema.optional(),
  firstLink: onboardingFirstLinkSchema.optional(),
  createFirstLink: z.boolean().optional().default(false),
  progressPayload: z.record(z.string(), z.unknown()).optional(),
});

export const onboardingCompleteSchema = z.object({
  firstVideoUploaded: z.boolean().optional().default(false),
  goTo: z.enum(["dashboard", "build-link"]).optional().default("dashboard"),
});

export const onboardingSkipSchema = z.object({
  reason: z.string().trim().max(120).optional().default("fill_later"),
});
