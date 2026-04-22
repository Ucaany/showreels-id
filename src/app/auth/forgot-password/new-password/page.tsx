"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { LockKeyhole } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showFeedbackAlert } from "@/lib/feedback-alert";

const schema = z
  .object({
    password: z.string().trim().min(8, "Password minimal 8 karakter."),
    confirmPassword: z.string().trim(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama.",
  });

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordNewPasswordPage() {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const response = await fetch("/api/auth/password-recovery/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      await showFeedbackAlert({
        title: "Reset password gagal",
        text:
          payload?.error ||
          "Sesi reset tidak valid atau password baru belum memenuhi syarat.",
        icon: "error",
      });
      return;
    }

    await showFeedbackAlert({
      title: "Password berhasil diperbarui",
      text: "Silakan login kembali menggunakan password baru.",
      icon: "success",
      confirmButtonText: "Ke halaman login",
    });
    router.replace("/auth/login");
  });

  return (
    <AuthShell
      title="Buat sandi baru"
      subtitle="Gunakan sandi baru yang berbeda dari sandi sebelumnya."
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
            <LockKeyhole className="h-4 w-4 text-brand-600" />
            Password baru
          </label>
          <Input type="password" placeholder="********" {...form.register("password")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.password?.message}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <LockKeyhole className="h-4 w-4 text-brand-600" />
            Konfirmasi password baru
          </label>
          <Input
            type="password"
            placeholder="********"
            {...form.register("confirmPassword")}
          />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.confirmPassword?.message}
          </p>
        </div>

        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Menyimpan..." : "Simpan password baru"}
        </Button>
      </motion.form>

      <p className="mt-5 text-center text-sm text-slate-600">
        Kembali ke{" "}
        <Link href="/auth/login" className="font-semibold text-brand-600">
          halaman login
        </Link>
      </p>
    </AuthShell>
  );
}
