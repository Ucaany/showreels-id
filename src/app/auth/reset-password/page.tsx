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

export default function ResetPasswordPage() {
  const { resetPassword } = useMockApp();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    const result = await resetPassword(password);
    if (!result.ok) {
      setError(result.error ?? "Gagal reset password.");
      return;
    }
    setMessage(result.data?.notice ?? "Password berhasil direset.");
    form.reset();
  });

  return (
    <AuthShell
      title="Set Password Baru"
      subtitle="Untuk MVP frontend, proses ini masih berupa simulasi tanpa backend."
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
            Password Baru
          </label>
          <Input type="password" placeholder="********" {...form.register("password")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.password?.message}
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
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
        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
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
