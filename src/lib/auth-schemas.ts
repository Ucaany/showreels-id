import { z } from "zod";

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

export const profileSchema = z.object({
  fullName: z.string().min(2, "Nama minimal 2 karakter."),
  username: z
    .string()
    .min(3, "Username minimal 3 karakter.")
    .regex(/^[a-zA-Z0-9_]+$/, "Gunakan huruf, angka, atau underscore."),
  avatarUrl: z.string().trim().optional().or(z.literal("")),
  bio: z.string().max(500, "Bio maksimal 500 karakter."),
  experience: z.string().max(700, "Pengalaman maksimal 700 karakter."),
  skills: z.array(z.string()).default([]),
});

export const videoSchema = z.object({
  title: z.string().min(4, "Judul minimal 4 karakter."),
  sourceUrl: z.url("Masukkan URL yang valid."),
  tags: z.array(z.string()).default([]),
  visibility: videoVisibilitySchema.default("public"),
  description: z.string().max(1500, "Deskripsi terlalu panjang.").optional(),
});
