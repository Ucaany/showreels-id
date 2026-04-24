"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { AuthShell } from "@/components/auth/auth-shell";
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

export function SignupForm({
  googleEnabled,
  initialUsername = "",
}: {
  googleEnabled: boolean;
  initialUsername?: string;
}) {
  const { dictionary } = usePreferences();
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const authLock = useAuthAttemptLock();
  const supabase = createClient();
  const authUnavailable = !supabase;
  const authUnavailableMessage = "Layanan autentikasi belum siap. Coba refresh halaman.";
  const visibleSubmitError = authUnavailable ? authUnavailableMessage : submitError;
  const altActionClassName =
    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#d7cec7] bg-white px-4 text-sm font-semibold text-[#201b18] shadow-sm transition hover:bg-[#fbf7f4] focus:outline-none focus:ring-2 focus:ring-[#e6c2b9] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      username: initialUsername,
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!initialUsername) {
      return;
    }

    if (!form.getValues("username")) {
      form.setValue("username", initialUsername, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [form, initialUsername]);

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
    if (!supabase) {
      setSubmitError(authUnavailableMessage);
      void showFeedbackAlert({
        title: "Layanan belum siap",
        text: authUnavailableMessage,
        icon: "warning",
      });
      return;
    }

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
        <div className="space-y-2 sm:rounded-2xl sm:border sm:border-[#e3d8d2] sm:bg-[#fbf7f4] sm:p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#4c413b]">
            <UserRound className="h-4 w-4 text-[#e24f3b]" />
            Nama Lengkap
          </label>
          <Input {...form.register("fullName")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.fullName?.message}
          </p>
        </div>

        <div className="space-y-2 sm:rounded-2xl sm:border sm:border-[#e3d8d2] sm:bg-[#fbf7f4] sm:p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#4c413b]">
            <UserRound className="h-4 w-4 text-[#e24f3b]" />
            Username
          </label>
          <Input {...form.register("username")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.username?.message}
          </p>
        </div>

        <div className="space-y-2 sm:rounded-2xl sm:border sm:border-[#e3d8d2] sm:bg-[#fbf7f4] sm:p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#4c413b]">
            <Mail className="h-4 w-4 text-[#e24f3b]" />
            Email
          </label>
          <Input {...form.register("email")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.email?.message}
          </p>
        </div>

        <div className="space-y-2 sm:rounded-2xl sm:border sm:border-[#e3d8d2] sm:bg-[#fbf7f4] sm:p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#4c413b]">
            <LockKeyhole className="h-4 w-4 text-[#e24f3b]" />
            Password
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              className="pr-11"
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-[#7a6c64] transition hover:text-[#514640]"
              aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.password?.message}
          </p>
        </div>

        <div className="space-y-2 sm:rounded-2xl sm:border sm:border-[#e3d8d2] sm:bg-[#fbf7f4] sm:p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#4c413b]">
            <LockKeyhole className="h-4 w-4 text-[#e24f3b]" />
            Konfirmasi Password
          </label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              className="pr-11"
              {...form.register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-[#7a6c64] transition hover:text-[#514640]"
              aria-label={showConfirmPassword ? "Sembunyikan password" : "Lihat password"}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.confirmPassword?.message}
          </p>
        </div>

        {authLock.lockMessage || visibleSubmitError ? (
          <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {authLock.lockMessage || visibleSubmitError}
          </p>
        ) : null}

        <Button
          className="w-full"
          type="submit"
          disabled={form.formState.isSubmitting || authLock.isLocked || authUnavailable}
        >
          {authLock.isLocked
            ? "Daftar terkunci"
            : form.formState.isSubmitting
              ? "Membuat akun..."
              : dictionary.signup}
        </Button>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 pt-1 text-xs text-[#7f726a]">
          <span className="h-px bg-[#e0d6d0]" />
          <span>atau</span>
          <span className="h-px bg-[#e0d6d0]" />
        </div>
        <div className="space-y-2">
          {googleEnabled ? (
            <button
              type="button"
              className={altActionClassName}
              disabled={authLock.isLocked || authUnavailable}
              onClick={async () => {
                if (!supabase) {
                  setSubmitError(authUnavailableMessage);
                  void showFeedbackAlert({
                    title: "Layanan belum siap",
                    text: authUnavailableMessage,
                    icon: "warning",
                  });
                  return;
                }

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
            </button>
          ) : null}
          <Link href="/auth/login" className={altActionClassName}>
            {dictionary.login}
          </Link>
        </div>
      </motion.form>
    </AuthShell>
  );
}

