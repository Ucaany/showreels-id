"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { signIn } from "next-auth/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthAttemptLock } from "@/hooks/use-auth-attempt-lock";
import { usePreferences } from "@/hooks/use-preferences";
import { showFeedbackAlert } from "@/lib/feedback-alert";
import { getSafeNextPath } from "@/lib/safe-next-path";
import { cn } from "@/lib/cn";

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

export function SignupForm({
  initialUsername = "",
  nextPath = "/dashboard",
}: {
  initialUsername?: string;
  nextPath?: string;
}) {
  const { dictionary } = usePreferences();
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const authLock = useAuthAttemptLock();
  const safeNextPath = getSafeNextPath(nextPath);
  const loginHref =
    safeNextPath === "/dashboard"
      ? "/auth/login"
      : `/auth/login?next=${encodeURIComponent(safeNextPath)}`;
  const altActionClassName =
    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm shadow-slate-900/5 transition hover:border-[#dbe5ff] hover:bg-[#eef4ff] hover:text-[#1a46c9] focus:outline-none focus:ring-2 focus:ring-[#dbe5ff] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

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
  const isFormDisabled = form.formState.isSubmitting || authLock.isLocked;

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
      // 1. Register user via API
      const registerRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          name: values.fullName,
          username: values.username,
        }),
      });

      const registerData = (await registerRes.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!registerRes.ok) {
        const attempt = authLock.registerFailure();
        const message = registerData?.error || "Gagal membuat akun.";
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

      // 2. Auto-login with credentials
      const signInResult = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (signInResult?.error) {
        authLock.clearFailures();
        const message = "Akun dibuat, tetapi login otomatis gagal. Silakan login manual.";
        setSubmitError(message);
        void showFeedbackAlert({
          title: "Akun berhasil dibuat",
          text: "Login otomatis belum berhasil. Silakan coba masuk dengan email dan password yang baru dibuat.",
          icon: "warning",
        });
        return;
      }

      // 3. Bootstrap profile sync
      const bootstrapRes = await fetch(
        `/api/auth/bootstrap?next=${encodeURIComponent(safeNextPath)}`,
        { method: "POST" }
      );
      const bootstrapData = (await bootstrapRes.json().catch(() => null)) as {
        error?: string;
        redirectTo?: string;
        code?: string;
      } | null;

      if (!bootstrapRes.ok) {
        if (bootstrapData?.code === "account_blocked") {
          setSubmitError(
            bootstrapData.error ||
              "Akun ini sedang diblokir dan belum bisa digunakan."
          );
          void showFeedbackAlert({
            title: "Akun diblokir",
            text:
              bootstrapData.error ||
              "Akun ini sedang diblokir dan belum bisa digunakan.",
            icon: "warning",
          });
          return;
        }

        const message =
          bootstrapData?.error || "Sinkronisasi akun belum berhasil. Coba lagi.";
        setSubmitError(message);
        void showFeedbackAlert({
          title: "Profil belum siap",
          text: message,
          icon: "warning",
        });
        return;
      }

      // 4. Success
      authLock.clearFailures();
      await showFeedbackAlert({
        title: "🎉 Berhasil Daftar",
        text: "Akun Anda berhasil di-upgrade ke plan Creator gratis selama 1 bulan!",
        icon: "success",
        confirmButtonText: "Lanjut ke Dashboard",
      });
      window.location.replace(bootstrapData?.redirectTo || "/dashboard");
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
      subtitle="Buat akun creator dengan form yang rapi, jelas, dan siap terhubung ke portofolio publik."
      showPreferences={false}
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
            <UserRound className="h-4 w-4 text-[#1a46c9]" />
            Nama Lengkap
          </label>
          <Input
            disabled={isFormDisabled}
            className={cn(
              form.formState.errors.fullName &&
                "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
            )}
            {...form.register("fullName")}
          />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.fullName?.message}
          </p>
        </div>

        <div className="space-y-2 sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-slate-50/70 sm:p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <UserRound className="h-4 w-4 text-[#1a46c9]" />
            Username
          </label>
          <Input
            disabled={isFormDisabled}
            className={cn(
              form.formState.errors.username &&
                "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
            )}
            {...form.register("username")}
          />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.username?.message}
          </p>
        </div>

        <div className="space-y-2 sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-slate-50/70 sm:p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Mail className="h-4 w-4 text-[#1a46c9]" />
            Email
          </label>
          <Input
            disabled={isFormDisabled}
            className={cn(
              form.formState.errors.email &&
                "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
            )}
            {...form.register("email")}
          />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.email?.message}
          </p>
        </div>

        <div className="space-y-2 sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-slate-50/70 sm:p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <LockKeyhole className="h-4 w-4 text-[#1a46c9]" />
            Password
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              disabled={isFormDisabled}
              className={cn(
                "pr-11",
                form.formState.errors.password &&
                  "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
              )}
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-[#1a46c9] transition hover:text-[#153aa8]"
              aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.password?.message}
          </p>
        </div>

        <div className="space-y-2 sm:rounded-2xl sm:border sm:border-slate-200 sm:bg-slate-50/70 sm:p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <LockKeyhole className="h-4 w-4 text-[#1a46c9]" />
            Konfirmasi Password
          </label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              disabled={isFormDisabled}
              className={cn(
                "pr-11",
                form.formState.errors.confirmPassword &&
                  "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
              )}
              {...form.register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-[#1a46c9] transition hover:text-[#153aa8]"
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

        {authLock.lockMessage || submitError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {authLock.lockMessage || submitError}
          </p>
        ) : null}

        <Button
          className="w-full bg-[#1a46c9] text-white shadow-sm shadow-[#1a46c9]/20 hover:bg-[#153aa8] focus-visible:ring-[#dbe5ff]"
          type="submit"
          disabled={isFormDisabled}
        >
          {authLock.isLocked
            ? "Daftar terkunci"
            : form.formState.isSubmitting
              ? "Membuat akun..."
              : dictionary.signup}
        </Button>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 pt-1 text-xs text-slate-500">
          <span className="h-px bg-gradient-to-r from-transparent via-slate-200 to-[#dbe5ff]" />
          <span>atau</span>
          <span className="h-px bg-gradient-to-r from-[#dbe5ff] via-slate-200 to-transparent" />
        </div>
        <div className="space-y-2">
          <Link href={loginHref} className={altActionClassName}>
            {dictionary.login}
          </Link>
        </div>
      </motion.form>
    </AuthShell>
  );
}
