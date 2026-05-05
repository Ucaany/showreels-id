"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { CalendarDays, UserRound } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showFeedbackAlert } from "@/lib/feedback-alert";

const schema = z.object({
  fullName: z.string().trim().min(2, "Nama lengkap minimal 2 karakter."),
  username: z
    .string()
    .trim()
    .min(3, "Username minimal 3 karakter.")
    .regex(/^[a-zA-Z0-9_]+$/, "Gunakan huruf, angka, atau underscore."),
  birthDate: z
    .string()
    .trim()
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "Format tanggal lahir harus YYYY-MM-DD.",
    }),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", username: "", birthDate: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const response = await fetch("/api/auth/password-recovery/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; redirectTo?: string }
      | null;

    if (!response.ok) {
      await showFeedbackAlert({
        title: "Verifikasi gagal",
        text: payload?.error || "Data yang diisi belum cocok.",
        icon: "error",
      });
      return;
    }

    await showFeedbackAlert({
      title: "Verifikasi berhasil",
      text: "Lanjutkan dengan membuat password baru.",
      icon: "success",
      confirmButtonText: "Lanjut",
    });
    router.push(payload?.redirectTo || "/auth/forgot-password/new-password");
  });

  return (
    <AuthShell
      title="Lupa password"
      subtitle="Masukkan nama lengkap, username, dan tanggal lahir untuk verifikasi akun."
    >
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <UserRound className="h-4 w-4 text-brand-600" />
            Nama lengkap
          </label>
          <Input placeholder="Nama sesuai profil" {...form.register("fullName")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.fullName?.message}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <UserRound className="h-4 w-4 text-brand-600" />
            Username
          </label>
          <Input placeholder="username_kamu" {...form.register("username")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.username?.message}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <CalendarDays className="h-4 w-4 text-brand-600" />
            Tanggal lahir
          </label>
          <Input type="date" {...form.register("birthDate")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.birthDate?.message}
          </p>
        </div>

        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Memverifikasi..." : "Lanjut verifikasi"}
        </Button>
      </motion.form>

      <p className="mt-5 text-center text-sm text-slate-600">
        Sudah ingat password?{" "}
        <Link href="/auth/login" className="font-semibold text-brand-600">
          Kembali ke login
        </Link>
      </p>
    </AuthShell>
  );
}
