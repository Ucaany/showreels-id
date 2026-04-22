"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { LockKeyhole, Mail, UserRound } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { AuthShell } from "@/components/auth/auth-shell";
import { WhatsappSharingCard } from "@/components/auth/whatsapp-sharing-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useAuthAttemptLock } from "@/hooks/use-auth-attempt-lock";
import { usePreferences } from "@/hooks/use-preferences";
import { getAuthRedirectUrl } from "@/lib/auth-redirect-url";
import { showFeedbackAlert } from "@/lib/feedback-alert";

const signupSchema = z
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

type SignupValues = z.infer<typeof signupSchema>;

async function finalizeSignedInSession() {
  const response = await fetch("/api/auth/bootstrap", {
    method: "POST",
  });
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; redirectTo?: string }
    | null;

  if (!response.ok) {
    return {
      ok: false as const,
      message:
        payload?.error ||
        "Akun berhasil dibuat, tetapi profilnya belum bisa disiapkan.",
    };
  }

  return {
    ok: true as const,
    redirectTo: payload?.redirectTo || "/dashboard",
  };
}

export function SignupForm({ googleEnabled }: { googleEnabled: boolean }) {
  const { dictionary } = usePreferences();
  const [submitError, setSubmitError] = useState("");
  const authLock = useAuthAttemptLock();
  const supabase = createClient();

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onInvalidSubmit = () => {
    const attempt = authLock.registerFailure();
    const message = attempt.isLocked
      ? attempt.message
      : "Periksa kembali data pendaftaran yang diisi.";

    setSubmitError(message);
    void showFeedbackAlert({
      title: attempt.isLocked ? "Daftar dikunci sementara" : "Input belum valid",
      text: message,
      icon: attempt.isLocked ? "warning" : "error",
    });
  };

  const onSubmit = async (values: SignupValues) => {
    if (authLock.isLocked) {
      setSubmitError(authLock.lockMessage);
      void showFeedbackAlert({
        title: "Daftar dikunci sementara",
        text: authLock.lockMessage,
        icon: "warning",
      });
      return;
    }

    setSubmitError("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            username: values.username,
          },
          emailRedirectTo: getAuthRedirectUrl("/dashboard"),
        },
      });

      if (error) {
        const attempt = authLock.registerFailure();
        const message = error.message || "Gagal membuat akun.";
        const visibleMessage = attempt.isLocked ? attempt.message : message;
        setSubmitError(visibleMessage);
        void showFeedbackAlert({
          title: attempt.isLocked
            ? "Daftar dikunci sementara"
            : "Daftar akun gagal",
          text: visibleMessage,
          icon: attempt.isLocked ? "warning" : "error",
        });
        return;
      }

      if (!data.session) {
        authLock.clearFailures();
        const message = "Akun dibuat, tetapi login otomatis gagal.";
        setSubmitError(message);
        void showFeedbackAlert({
          title: "Akun berhasil dibuat",
          text: "Silakan login manual dengan email dan password yang baru dibuat.",
          icon: "warning",
        });
        return;
      }

      const bootstrapResult = await finalizeSignedInSession();

      if (!bootstrapResult.ok) {
        await supabase.auth.signOut();
        setSubmitError(bootstrapResult.message);
        void showFeedbackAlert({
          title: "Profil belum siap",
          text: bootstrapResult.message,
          icon: "warning",
        });
        return;
      }

      authLock.clearFailures();
      await showFeedbackAlert({
        title: "Berhasil Daftar",
        text: "Kamu akan diarahkan ke halaman terkait.",
        icon: "success",
        confirmButtonText: "Lanjut",
      });
      window.location.replace(bootstrapResult.redirectTo);
    } catch {
      const message = "Registrasi belum bisa diproses. Periksa koneksi lalu coba lagi.";
      setSubmitError(message);
      void showFeedbackAlert({
        title: "Koneksi bermasalah",
        text: message,
        icon: "error",
      });
    }
  };

  return (
    <AuthShell
      title={dictionary.authSignupTitle}
      subtitle="Buat akun creator dengan tampilan yang lebih bersih dan alur registrasi yang sederhana."
    >
      <motion.form
        onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)}
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="space-y-2 sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-slate-50/70 sm:p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <UserRound className="h-4 w-4 text-brand-600" />
            Nama Lengkap
          </label>
          <Input {...form.register("fullName")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.fullName?.message}
          </p>
        </div>

        <div className="space-y-2 sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-slate-50/70 sm:p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <UserRound className="h-4 w-4 text-brand-600" />
            Username
          </label>
          <Input {...form.register("username")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.username?.message}
          </p>
        </div>

        <div className="space-y-2 sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-slate-50/70 sm:p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Mail className="h-4 w-4 text-brand-600" />
            Email
          </label>
          <Input {...form.register("email")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.email?.message}
          </p>
        </div>

        <div className="space-y-2 sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-slate-50/70 sm:p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <LockKeyhole className="h-4 w-4 text-brand-600" />
            Password
          </label>
          <Input type="password" {...form.register("password")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.password?.message}
          </p>
        </div>

        <div className="space-y-2 sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-slate-50/70 sm:p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <LockKeyhole className="h-4 w-4 text-brand-600" />
            Konfirmasi Password
          </label>
          <Input type="password" {...form.register("confirmPassword")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.confirmPassword?.message}
          </p>
        </div>

        {authLock.lockMessage || submitError ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {authLock.lockMessage || submitError}
          </p>
        ) : null}

        <Button
          className="w-full"
          type="submit"
          disabled={form.formState.isSubmitting || authLock.isLocked}
        >
          {authLock.isLocked
            ? "Daftar terkunci"
            : form.formState.isSubmitting
              ? "Membuat akun..."
              : dictionary.signup}
        </Button>

        {googleEnabled ? (
          <>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 pt-1 text-xs text-slate-500">
              <span className="h-px bg-slate-200" />
              <span>atau</span>
              <span className="h-px bg-slate-200" />
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full border border-slate-300 bg-white text-slate-950 shadow-sm hover:bg-white"
              disabled={authLock.isLocked}
              onClick={async () => {
                if (authLock.isLocked) {
                  setSubmitError(authLock.lockMessage);
                  void showFeedbackAlert({
                    title: "Daftar dikunci sementara",
                    text: authLock.lockMessage,
                    icon: "warning",
                  });
                  return;
                }

                const { data, error } = await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    redirectTo: getAuthRedirectUrl("/dashboard"),
                    queryParams: {
                      prompt: "select_account",
                    },
                  },
                });

                if (error) {
                  const attempt = authLock.registerFailure();
                  const message = "Google login belum berhasil.";
                  const visibleMessage = attempt.isLocked ? attempt.message : message;
                  setSubmitError(visibleMessage);
                  void showFeedbackAlert({
                    title: attempt.isLocked
                      ? "Daftar dikunci sementara"
                      : "Google login gagal",
                    text: visibleMessage,
                    icon: attempt.isLocked ? "warning" : "error",
                  });
                  return;
                }

                if (data.url) {
                  window.location.assign(data.url);
                }
              }}
            >
              <FcGoogle className="h-5 w-5" />
              {dictionary.continueGoogle}
            </Button>
          </>
        ) : null}
      </motion.form>

      <div className="mt-5 space-y-2 text-center text-sm text-slate-600">
        <p>{dictionary.hasAccount}</p>
        <Link
          href="/auth/login"
          className="inline-flex h-11 min-w-[170px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
        >
          {dictionary.login}
        </Link>
      </div>
      <WhatsappSharingCard />
    </AuthShell>
  );
}

