"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMockApp } from "@/hooks/use-mock-app";

const schema = z.object({
  email: z.email("Format email belum valid."),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useMockApp();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setError("");
    setMessage("");
    const result = await requestPasswordReset(email);
    if (!result.ok) {
      setError(result.error ?? "Gagal memproses reset password.");
      return;
    }
    setMessage(result.data?.notice ?? "Link reset berhasil dikirim.");
  });

  return (
    <AuthShell
      title="Reset Password"
      subtitle="Masukkan email untuk menerima tautan reset (mode simulasi frontend)."
    >
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Email akun
          </label>
          <Input placeholder="nama@email.com" {...form.register("email")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.email?.message}
          </p>
        </div>

        {message ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Mengirim..." : "Kirim Tautan Reset"}
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
