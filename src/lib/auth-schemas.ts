import { z } from "zod";
import { normalizeSocialUrl } from "@/lib/profile-utils";

export const videoVisibilitySchema = z.enum(["draft", "private", "public"]);

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
      .regex(/^[a-zA-Z0-9_]+$/, "Gunakan huruf, angka, atau underscore."),
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

const birthDateSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Format tanggal lahir harus YYYY-MM-DD.",
  });

export const profileSchema = z.object({
  fullName: z.string().min(2, "Nama minimal 2 karakter."),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter.")
    .regex(/^[a-zA-Z0-9_]+$/, "Gunakan huruf, angka, atau underscore."),
  role: z.string().trim().max(120, "Role terlalu panjang.").default(""),
  avatarUrl: z.string().trim().optional().or(z.literal("")),
  coverImageUrl: z.string().trim().optional().or(z.literal("")),
  bio: z.string().max(500, "Bio maksimal 500 karakter."),
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
  skills: z.array(z.string()).default([]),
});

export const videoSchema = z.object({
  title: z.string().min(4, "Judul minimal 4 karakter."),
  sourceUrl: z.url("Masukkan URL yang valid."),
  thumbnailUrl: z.string().trim().optional().or(z.literal("")),
  extraVideoUrls: z.array(z.string().url("URL video tambahan tidak valid.")).default([]),
  imageUrls: z.array(z.string().url("URL gambar tidak valid.")).default([]),
  tags: z.array(z.string()).default([]),
  visibility: videoVisibilitySchema.default("public"),
  description: z.string().max(1500, "Deskripsi terlalu panjang.").optional(),
});
