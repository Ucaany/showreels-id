"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { LockKeyhole } from "lucide-react";
import { signOut } from "next-auth/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z
  .object({
    password: z.string().min(8, "Password minimal 8 karakter."),
    confirmPassword: z.string(),
  })
  .refine((val) => val.password === val.confirmPassword, {
    message: "Konfirmasi password tidak sama.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const token = searchParams.get("token") || "";
  const tokenError = token ? "" : "Token reset password tidak ditemukan atau sudah berakhir.";
  const visibleError = error || tokenError;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(async ({ password }) => {
    setError("");
    setMessage("");

    if (!token) {
      setError("Token reset password tidak valid.");
      return;
    }

    try {
      const res = await fetch("/api/auth/password-recovery/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!res.ok) {
        setError(data?.error || "Gagal reset password.");
        return;
      }

      setMessage("Password berhasil diperbarui. Silakan login kembali.");
      form.reset();
      await signOut({ redirect: false }).catch(() => null);
      setTimeout(() => router.replace("/auth/login"), 900);
    } catch {
      setError("Gagal menghubungi server. Coba lagi.");
    }
  });

  return (
    <AuthShell
      title="Reset password"
      subtitle="Masukkan password baru untuk menyelesaikan proses reset akun."
    >
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {visibleError && !message ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {visibleError}
          </p>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <LockKeyhole className="h-4 w-4 text-brand-600" />
            Password Baru
          </label>
          <Input type="password" placeholder="********" {...form.register("password")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.password?.message}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <LockKeyhole className="h-4 w-4 text-brand-600" />
            Konfirmasi Password Baru
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

        {message ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}
        {error && !message ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <Button
          className="w-full"
          type="submit"
          disabled={form.formState.isSubmitting || !token || Boolean(message)}
        >
          {form.formState.isSubmitting ? "Menyimpan..." : "Simpan Password Baru"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="Reset password"
          subtitle="Memuat form reset password."
        >
          <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
        </AuthShell>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
