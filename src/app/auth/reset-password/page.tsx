"use client";

import { useEffect, useState } from "react";
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
import { createClient } from "@/lib/supabase/client";

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
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const supabase = createClient();
  const authUnavailable = !supabase;
  const authUnavailableMessage = "Layanan autentikasi belum siap. Coba refresh halaman.";
  const [ready, setReady] = useState(authUnavailable);
  const visibleError = error || (authUnavailable ? authUnavailableMessage : "");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (!active) {
        return;
      }

      if (!data.user) {
        setError("Sesi reset password tidak valid atau sudah berakhir.");
      }

      setReady(true);
    });

    return () => {
      active = false;
    };
  }, [supabase]);

  const onSubmit = form.handleSubmit(async ({ password }) => {
    setError("");
    setMessage("");

    if (!supabase) {
      setError(authUnavailableMessage);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message || "Gagal reset password.");
      return;
    }

    setMessage("Password berhasil diperbarui. Silakan login kembali.");
    form.reset();
    await supabase.auth.signOut();
    setTimeout(() => router.replace("/auth/login"), 900);
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
        {!ready ? (
          <p className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
            Menyiapkan sesi reset password...
          </p>
        ) : null}

        {ready && visibleError && !message ? (
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
        {visibleError && !message ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {visibleError}
          </p>
        ) : null}

        <Button
          className="w-full"
          type="submit"
          disabled={
            form.formState.isSubmitting || !ready || Boolean(visibleError && !message)
          }
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
