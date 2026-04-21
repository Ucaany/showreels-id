"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.email("Format email belum valid."),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setError("");
    setMessage("");

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: string; notice?: string; resetPath?: string }
      | null;

    if (!response.ok) {
      setError(payload?.error ?? "Gagal memproses reset password.");
      return;
    }

    setMessage(payload?.notice ?? "Link reset berhasil disiapkan.");

    if (payload?.resetPath) {
      setTimeout(() => router.push(payload.resetPath as string), 900);
    }
  });

  return (
    <AuthShell
      title="Lupa password"
      subtitle="Masukkan email akunmu. Untuk fase ini, link reset akan langsung diarahkan di browser."
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
            <Mail className="h-4 w-4 text-brand-600" />
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
          {form.formState.isSubmitting ? "Menyiapkan..." : "Lanjut reset password"}
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
