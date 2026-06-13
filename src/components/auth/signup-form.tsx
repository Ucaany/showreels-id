"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Eye, EyeOff, LockKeyhole, Mail, Sparkles, UserRound } from "lucide-react";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthAttemptLock } from "@/hooks/use-auth-attempt-lock";
import { usePreferences } from "@/hooks/use-preferences";
import { signUpSchema } from "@/lib/auth-schemas";
import { cn } from "@/lib/cn";
import { showFeedbackAlert } from "@/lib/feedback-alert";
import { getSafeNextPath } from "@/lib/safe-next-path";

type SignupValues = z.infer<typeof signUpSchema>;

function isGoogleEnabled() {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true"
  );
}

export function SignupForm({
  initialUsername = "",
  nextPath = "/dashboard",
}: {
  initialUsername?: string;
  nextPath?: string;
}) {
  const { dictionary } = usePreferences();
  const authLock = useAuthAttemptLock();
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const googleEnabled = useMemo(() => isGoogleEnabled(), []);
  const safeNextPath = getSafeNextPath(nextPath);
  const loginHref =
    safeNextPath === "/dashboard"
      ? "/auth/login"
      : `/auth/login?next=${encodeURIComponent(safeNextPath)}`;

  const form = useForm<SignupValues>({
    resolver: zodResolver(signUpSchema),
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
    if (!initialUsername || form.getValues("username")) {
      return;
    }

    form.setValue("username", initialUsername, {
      shouldDirty: false,
      shouldValidate: true,
    });
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
      return;
    }

    setSubmitError("");

    try {
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const registerPayload = (await registerResponse.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!registerResponse.ok) {
        const attempt = authLock.registerFailure();
        const message = attempt.isLocked
          ? attempt.message
          : registerPayload?.error || "Gagal membuat akun.";
        setSubmitError(message);
        void showFeedbackAlert({
          title: attempt.isLocked ? "Daftar dikunci sementara" : "Daftar belum berhasil",
          text: message,
          icon: attempt.isLocked ? "warning" : "error",
        });
        return;
      }

      const signInResult = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (signInResult?.error) {
        authLock.clearFailures();
        const message =
          "Akun sudah dibuat, tetapi login otomatis belum berhasil. Silakan masuk manual.";
        setSubmitError(message);
        void showFeedbackAlert({
          title: "Akun berhasil dibuat",
          text: message,
          icon: "warning",
        });
        return;
      }

      const bootstrapResponse = await fetch(
        `/api/auth/bootstrap?next=${encodeURIComponent(safeNextPath)}`,
        { method: "POST" }
      );
      const bootstrapPayload = (await bootstrapResponse.json().catch(() => null)) as
        | { error?: string; code?: string; redirectTo?: string }
        | null;

      if (!bootstrapResponse.ok) {
        const message =
          bootstrapPayload?.error || "Akun sudah dibuat, tetapi setup awal belum selesai.";
        setSubmitError(message);
        void showFeedbackAlert({
          title:
            bootstrapPayload?.code === "account_blocked"
              ? "Akun diblokir"
              : "Profil belum siap",
          text: message,
          icon: bootstrapPayload?.code === "account_blocked" ? "warning" : "error",
        });
        return;
      }

      authLock.clearFailures();
      await showFeedbackAlert({
        title: "Akun berhasil dibuat",
        text: "Sekarang kamu bisa lanjut ke dashboard creator dan mulai setup profil.",
        icon: "success",
        confirmButtonText: "Lanjut",
      });
      window.location.replace(bootstrapPayload?.redirectTo || "/dashboard");
    } catch {
      const message = "Pendaftaran belum bisa diproses. Coba lagi sebentar lagi.";
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
      subtitle="Buat akun creator dengan username, email, dan password yang siap dipakai untuk portofolio publik."
      showPreferences={false}
    >
      <motion.form
        onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-orange-50 px-5 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-950">
                Akun creator dibuat langsung dengan username + password
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Setelah daftar, sistem akan otomatis menyiapkan profil, trial Creator,
                dan mengarahkan kamu ke dashboard atau onboarding yang sesuai.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 rounded-3xl border border-zinc-200 bg-zinc-50/70 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <UserRound className="h-4 w-4 text-orange-600" />
            Nama lengkap
          </label>
          <Input
            disabled={isFormDisabled}
            className={cn(
              form.formState.errors.fullName &&
                "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
            )}
            {...form.register("fullName")}
          />
          {form.formState.errors.fullName ? (
            <p className="text-xs text-rose-600">{form.formState.errors.fullName.message}</p>
          ) : null}
        </div>

        <div className="space-y-2 rounded-3xl border border-zinc-200 bg-zinc-50/70 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <UserRound className="h-4 w-4 text-orange-600" />
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
          <p className="text-xs text-zinc-500">
            Gunakan huruf kecil, angka, underscore, atau dash.
          </p>
          {form.formState.errors.username ? (
            <p className="text-xs text-rose-600">{form.formState.errors.username.message}</p>
          ) : null}
        </div>

        <div className="space-y-2 rounded-3xl border border-zinc-200 bg-zinc-50/70 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <Mail className="h-4 w-4 text-orange-600" />
            Email
          </label>
          <Input
            type="email"
            disabled={isFormDisabled}
            className={cn(
              form.formState.errors.email &&
                "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
            )}
            {...form.register("email")}
          />
          {form.formState.errors.email ? (
            <p className="text-xs text-rose-600">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2 rounded-3xl border border-zinc-200 bg-zinc-50/70 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <LockKeyhole className="h-4 w-4 text-orange-600" />
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
              className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-orange-600 transition hover:text-orange-700"
              aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.password ? (
            <p className="text-xs text-rose-600">{form.formState.errors.password.message}</p>
          ) : null}
        </div>

        <div className="space-y-2 rounded-3xl border border-zinc-200 bg-zinc-50/70 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <LockKeyhole className="h-4 w-4 text-orange-600" />
            Konfirmasi password
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
              className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-orange-600 transition hover:text-orange-700"
              aria-label={
                showConfirmPassword ? "Sembunyikan password" : "Lihat password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {form.formState.errors.confirmPassword ? (
            <p className="text-xs text-rose-600">
              {form.formState.errors.confirmPassword.message}
            </p>
          ) : null}
        </div>

        {authLock.lockMessage || submitError ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {authLock.lockMessage || submitError}
          </p>
        ) : null}

        <Button
          className="h-11 w-full rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800"
          type="submit"
          disabled={isFormDisabled}
        >
          {authLock.isLocked
            ? "Daftar terkunci"
            : form.formState.isSubmitting
              ? "Membuat akun..."
              : dictionary.signup}
        </Button>

        {googleEnabled ? (
          <>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs text-zinc-500">
              <span className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-orange-100" />
              <span>atau</span>
              <span className="h-px bg-gradient-to-r from-orange-100 via-zinc-200 to-transparent" />
            </div>

            <button
              type="button"
              onClick={() =>
                signIn("google", {
                  callbackUrl: safeNextPath,
                  redirect: true,
                })
              }
              disabled={isFormDisabled}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Daftar dengan Google
            </button>
          </>
        ) : null}

        <p className="pt-1 text-center text-sm text-zinc-600">{dictionary.hasAccount}</p>
        <Link
          href={loginHref}
          className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
        >
          {dictionary.login}
        </Link>
      </motion.form>
    </AuthShell>
  );
}
