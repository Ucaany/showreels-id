import { z } from "zod";
import { USERNAME_REGEX, isReservedUsername } from "@/lib/username-rules";

export const privacySettingsSchema = z.object({
  publicProfile: z.boolean(),
  searchIndexing: z.boolean(),
  showPublicEmail: z.boolean(),
  showSocialLinks: z.boolean(),
  showPublicStats: z.boolean(),
});

export const linkProfileSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3, "Slug minimal 3 karakter.")
    .max(30, "Slug maksimal 30 karakter.")
    .regex(USERNAME_REGEX, "Gunakan huruf kecil, angka, underscore, atau dash.")
    .refine((value) => !isReservedUsername(value), {
      message: "Slug tidak dapat digunakan.",
    }),
});

export const paymentSettingsSchema = z.object({
  billingEmail: z.string().trim().email("Format billing email tidak valid."),
  paymentMethod: z.string().trim().min(2).max(40).default("bayar_gg"),
  paymentEnabled: z.boolean().default(true),
  taxInfo: z.string().trim().max(180).default(""),
  invoiceNotes: z.string().trim().max(300).default(""),
});

export const whitelabelSettingsSchema = z.object({
  enabled: z.boolean(),
});

