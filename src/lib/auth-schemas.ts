import { z } from "zod";
import { normalizeAvatarUrl } from "@/lib/avatar-utils";
import {
  MAX_CUSTOM_LINKS,
  MAX_LINK_DESCRIPTION_LENGTH,
  MAX_LINK_TITLE_LENGTH,
  normalizeSocialUrl,
} from "@/lib/profile-utils";
import {
  isReservedUsername,
  USERNAME_REGEX,
} from "@/lib/username-rules";
import { normalizeAssetUrl, normalizeHttpUrl } from "@/lib/video-utils";

export const profileVisibilitySchema = z.enum(["private", "semi_private", "public"]);
export const videoVisibilitySchema = z.enum(["draft", "private", "semi_private", "public"]);
export const videoAspectRatioSchema = z.enum(["landscape", "portrait"]);

export const signInSchema = z.object({
  email: z.email("Format email belum valid."),
  password: z.string().min(8, "Password minimal 8 karakter."),
});

export const signUpSchema = z
  .object({
    fullName: z.string().min(2, "Nama minimal 2 karakter."),
    username: z
      .string()
      .min(3, "Username minimal 3 karakter.")
      .max(30, "Username maksimal 30 karakter.")
      .regex(USERNAME_REGEX, "Gunakan huruf kecil, angka, underscore, atau dash.")
      .refine((value) => !isReservedUsername(value), {
        message: "Username tidak dapat digunakan.",
      }),
    email: z.email("Format email belum valid."),
    password: z.string().min(8, "Password minimal 8 karakter."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama.",
  });

const socialUrlSchema = z
  .string()
  .trim()
  .max(300, "URL social media terlalu panjang.")
  .transform((value) => normalizeSocialUrl(value))
  .refine((value) => value === "" || value.startsWith("http"), {
    message: "Masukkan URL social media yang valid.",
  });

const customLinkSchema = z.object({
  id: z.string().trim().min(1, "ID custom link tidak valid.").max(80),
  type: z.string().trim().max(30, "Tipe block terlalu panjang.").optional().default("link"),
  title: z
    .string()
    .trim()
    .min(1, "Judul custom link wajib diisi.")
    .max(MAX_LINK_TITLE_LENGTH, `Judul custom link maksimal ${MAX_LINK_TITLE_LENGTH} karakter.`),
  url: z
    .string()
    .trim()
    .max(300, "URL custom link terlalu panjang.")
    .transform((value) => normalizeSocialUrl(value))
    .refine((value) => value.startsWith("http"), {
      message: "Masukkan URL custom link yang valid.",
    }),
  value: z.string().trim().max(500, "Value block terlalu panjang.").optional().default(""),
  description: z
    .string()
    .trim()
    .max(
      MAX_LINK_DESCRIPTION_LENGTH,
      `Deskripsi custom link maksimal ${MAX_LINK_DESCRIPTION_LENGTH} karakter.`
    )
    .optional()
    .default(""),
  platform: z.string().trim().max(30, "Platform terlalu panjang.").optional().default(""),
  badge: z.string().trim().max(30, "Badge terlalu panjang.").optional().default(""),
  style: z.string().trim().max(40, "Style block terlalu panjang.").optional().default(""),
  thumbnailUrl: z
    .string()
    .trim()
    .max(300, "URL thumbnail terlalu panjang.")
    .transform((value) => normalizeSocialUrl(value))
    .optional()
    .default(""),
  iconKey: z.string().trim().max(40, "Icon terlalu panjang.").optional().default(""),
  iconUrl: z
    .string()
    .trim()
    .max(300, "URL icon terlalu panjang.")
    .transform((value) => normalizeSocialUrl(value))
    .optional()
    .default(""),
  enabled: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(99).default(0),
});

const customLinksSchema = z
  .array(customLinkSchema)
  .max(MAX_CUSTOM_LINKS, `Maksimal ${MAX_CUSTOM_LINKS} custom link.`)
  .default([])
  .transform((items) =>
    items.map((item, index) => ({
      ...item,
      order: index,
      enabled: item.enabled !== false,
    }))
  );

const mediaUrlSchema = z
  .string()
  .trim()
  .refine((value) => !value.toLowerCase().startsWith("data:"), {
    message: "Upload file langsung tidak didukung. Gunakan URL media.",
  })
  .max(1200, "URL media terlalu panjang.")
  .transform((value) => normalizeAssetUrl(value))
  .refine((value) => value === "" || value.startsWith("http"), {
    message: "Gunakan URL media http/https. Upload file langsung tidak didukung.",
  });

const avatarUrlSchema = z
  .string()
  .trim()
  .refine((value) => !value.toLowerCase().startsWith("data:"), {
    message: "Upload file langsung tidak didukung. Gunakan URL avatar.",
  })
  .max(1200, "URL avatar terlalu panjang.")
  .transform((value) => normalizeAvatarUrl(value))
  .refine((value) => value === "" || value.startsWith("http"), {
    message: "Gunakan URL avatar http/https. Upload file langsung tidak didukung.",
  });

const birthDateSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Format tanggal lahir harus YYYY-MM-DD.",
  });

const cropPercentSchema = z.coerce
  .number()
  .min(-100, "Posisi crop terlalu kecil.")
  .max(100, "Posisi crop terlalu besar.")
  .default(0);

const cropZoomSchema = z.coerce
  .number()
  .min(100, "Zoom crop minimal 100%.")
  .max(300, "Zoom crop maksimal 300%.")
  .default(100);

export const profileSchema = z.object({
  fullName: z.string().min(2, "Nama minimal 2 karakter."),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter.")
    .max(30, "Username maksimal 30 karakter.")
    .regex(USERNAME_REGEX, "Gunakan huruf kecil, angka, underscore, atau dash.")
    .refine((value) => !isReservedUsername(value), {
      message: "Username tidak dapat digunakan.",
    }),
  role: z.string().trim().max(120, "Role terlalu panjang.").default(""),
  avatarUrl: avatarUrlSchema.default(""),
  coverImageUrl: avatarUrlSchema.default(""),
  bio: z.string().max(240, "Bio maksimal 240 karakter."),
  experience: z.string().max(700, "Pengalaman maksimal 700 karakter."),
  birthDate: birthDateSchema.default(""),
  city: z.string().trim().max(120, "Kota terlalu panjang.").default(""),
  address: z.string().trim().max(240, "Alamat terlalu panjang.").default(""),
  contactEmail: z.email("Format email belum valid.").or(z.literal("")).default(""),
  phoneNumber: z
    .string()
    .trim()
    .max(30, "Nomor telepon terlalu panjang.")
    .refine((value) => value === "" || /^[0-9+\-\s()]+$/.test(value), {
      message: "Nomor telepon tidak valid.",
    })
    .default(""),
  websiteUrl: socialUrlSchema.default(""),
  instagramUrl: socialUrlSchema.default(""),
  youtubeUrl: socialUrlSchema.default(""),
  facebookUrl: socialUrlSchema.default(""),
  threadsUrl: socialUrlSchema.default(""),
  linkedinUrl: socialUrlSchema.default(""),
  customLinks: customLinksSchema.optional(),
  skills: z.array(z.string()).default([]),
  avatarCropX: cropPercentSchema,
  avatarCropY: cropPercentSchema,
  avatarCropZoom: cropZoomSchema,
  coverCropX: cropPercentSchema,
  coverCropY: cropPercentSchema,
  coverCropZoom: cropZoomSchema,
});

export const profileVisibilityUpdateSchema = z.object({
  profileVisibility: profileVisibilitySchema,
});

export const passwordRecoveryVerifySchema = z.object({
  fullName: z.string().trim().min(2, "Nama lengkap minimal 2 karakter."),
  username: z
    .string()
    .trim()
    .min(3, "Username minimal 3 karakter.")
    .max(30, "Username maksimal 30 karakter.")
    .regex(USERNAME_REGEX, "Gunakan huruf kecil, angka, underscore, atau dash.")
    .refine((value) => !isReservedUsername(value), {
      message: "Username tidak dapat digunakan.",
    }),
  birthDate: z
    .string()
    .trim()
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "Format tanggal lahir harus YYYY-MM-DD.",
    }),
});

export const passwordRecoveryResetSchema = z
  .object({
    password: z.string().trim().min(8, "Password minimal 8 karakter."),
    confirmPassword: z.string().trim(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama.",
  });

export const videoSchema = z.object({
  title: z.string().min(4, "Judul minimal 4 karakter."),
  sourceUrl: z.url("Masukkan URL yang valid."),
  aspectRatio: videoAspectRatioSchema.default("landscape"),
  outputType: z.string().trim().max(80, "Output terlalu panjang.").default(""),
  durationLabel: z.string().trim().max(30, "Durasi terlalu panjang.").default(""),
  thumbnailUrl: mediaUrlSchema.default(""),
  extraVideoUrls: z
    .array(
      z
        .string()
        .trim()
        .transform((value) => normalizeHttpUrl(value))
        .refine((value) => value.startsWith("http"), {
          message: "URL video tambahan tidak valid.",
        })
    )
    .default([]),
  imageUrls: z
    .array(
      z
        .string()
        .trim()
        .transform((value) => normalizeAssetUrl(value))
        .refine((value) => value.startsWith("http"), {
          message: "URL gambar tidak valid.",
        })
    )
    .default([]),
  tags: z.array(z.string()).default([]),
  visibility: videoVisibilitySchema.default("public"),
  description: z.string().max(1500, "Deskripsi terlalu panjang.").optional(),
});
