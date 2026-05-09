"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthAttemptLock } from "@/hooks/use-auth-attempt-lock";
import { usePreferences } from "@/hooks/use-preferences";
import { showFeedbackAlert } from "@/lib/feedback-alert";
import { getSafeNextPath } from "@/lib/safe-next-path";
import { cn } from "@/lib/cn";
import { DEMO_MODE } from "@/lib/demo-mode";

const loginSchema = z.object({
  email: z.email("Format email belum valid."),
  password: z.string().min(6, "Password minimal 6 karakter."),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm({
  oauthError = "",
  nextPath = "/dashboard",
}: {
  oauthError?: string;
  nextPath?: string;
}) {
  const { dictionary } = usePreferences();
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const authLock = useAuthAttemptLock();
  const safeNextPath = getSafeNextPath(nextPath);
  const isGoogleAuthEnabled =
    !DEMO_MODE &&
    (process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true" ||
      process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true");
  const resolveRedirectTarget = (resultUrl?: string | null) => {
    if (!resultUrl) return safeNextPath;

    if (resultUrl.startsWith("/")) {
      return getSafeNextPath(resultUrl, safeNextPath);
    }

    try {
      const parsed = new URL(resultUrl);
      return getSafeNextPath(
        `${parsed.pathname}${parsed.search}${parsed.hash}`,
        safeNextPath
      );
    } catch {
      return safeNextPath;
    }
  };
  const signupHref =
    safeNextPath === "/dashboard"
      ? "/auth/signup"
      : `/auth/signup?next=${encodeURIComponent(safeNextPath)}`;
  const altActionClassName =
    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm shadow-slate-900/5 transition hover:border-[#dbe5ff] hover:bg-[#eef4ff] hover:text-[#1a46c9] focus:outline-none focus:ring-2 focus:ring-[#dbe5ff] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const isFormDisabled = form.formState.isSubmitting || authLock.isLocked;

  const onInvalidSubmit = () => {
    const attempt = authLock.registerFailure();
    const message = attempt.isLocked
      ? attempt.message
      : "Periksa kembali email dan password yang diisi.";

    setSubmitError(message);
    void showFeedbackAlert({
      title: attempt.isLocked ? "Login dikunci sementara" : "Input belum valid",
      text: message,
      icon: attempt.isLocked ? "warning" : "error",
    });
  };

  const onSubmit = async (values: LoginValues) => {
    // Demo mode: use demo login API
    if (DEMO_MODE) {
      setSubmitError("");
      try {
        const res = await fetch("/api/auth/demo-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: values.email, password: values.password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSubmitError(data.error || "Login gagal.");
          void showFeedbackAlert({
            title: "Login gagal",
            text: data.error || "Email atau password tidak cocok.",
            icon: "error",
          });
          return;
        }
        await showFeedbackAlert({
          title: "Berhasil Login (Demo)",
          text: `Selamat datang, ${data.user?.name || "User"}!`,
          icon: "success",
          confirmButtonText: "Lanjut",
        });
        window.location.replace(data.redirectTo || "/dashboard");
      } catch {
        setSubmitError("Login gagal. Coba lagi.");
      }
      return;
    }

    if (authLock.isLocked) {
      setSubmitError(authLock.lockMessage);
      void showFeedbackAlert({
        title: "Login dikunci sementara",
        text: authLock.lockMessage,
        icon: "warning",
      });
      return;
    }

    setSubmitError("");
    try {
      const result = await signIn("credentials", {
        email: values.email.trim().toLowerCase(),
        password: values.password,
        callbackUrl: safeNextPath,
        redirect: false,
      });

      if (result?.error) {
        const attempt = authLock.registerFailure();
        const message = "Email atau password tidak cocok.";
        const visibleMessage = attempt.isLocked ? attempt.message : message;
        setSubmitError(visibleMessage);
        void showFeedbackAlert({
          title: attempt.isLocked ? "Login dikunci sementara" : "Login gagal",
          text: visibleMessage,
          icon: attempt.isLocked ? "warning" : "error",
        });
        return;
      }

      authLock.clearFailures();
      await showFeedbackAlert({
        title: "Berhasil Login",
        text: "Kamu akan diarahkan ke halaman terkait.",
        icon: "success",
        confirmButtonText: "Lanjut",
      });
      window.location.replace(resolveRedirectTarget(result?.url));
    } catch {
      const message = "Login belum bisa diproses. Periksa koneksi lalu coba lagi.";
      setSubmitError(message);
      void showFeedbackAlert({
        title: "Koneksi bermasalah",
        text: message,
        icon: "error",
      });
    }
  };

  useEffect(() => {
    if (!oauthError) return;
    void showFeedbackAlert({
      title: "Login belum berhasil",
      text: "Terjadi kesalahan saat proses autentikasi.",
      icon: "warning",
    });
  }, [oauthError]);

  return (
    <AuthShell
      title={dictionary.authLoginTitle}
      subtitle="Masuk ke dashboard creator dengan pengalaman yang bersih, aman, dan konsisten."
      showPreferences={false}
    >
      <motion.form
        onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)}
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {DEMO_MODE ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <p className="font-semibold mb-1">🧪 Demo Mode Aktif</p>
            <p className="text-xs leading-relaxed">
              <strong>Admin:</strong> admin@showreels.id / admin123<br />
              <strong>Creator:</strong> creator@showreels.id / creator123
            </p>
          </div>
        ) : null}

        <div className="space-y-2">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Mail className="h-4 w-4 text-[#1a46c9]" />
            Email
          </label>
          <Input
            placeholder="nama@email.com"
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

        <div className="space-y-2">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <LockKeyhole className="h-4 w-4 text-[#1a46c9]" />
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-semibold text-[#1a46c9] hover:text-[#153aa8]"
            >
              Lupa password?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="********"
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
            ? "Login terkunci"
            : form.formState.isSubmitting
              ? "Memproses..."
              : dictionary.login}
        </Button>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 pt-1 text-xs text-slate-500">
          <span className="h-px bg-gradient-to-r from-transparent via-slate-200 to-[#dbe5ff]" />
          <span>atau</span>
          <span className="h-px bg-gradient-to-r from-[#dbe5ff] via-slate-200 to-transparent" />
        </div>

        {/* Google Login Button - only show if Google OAuth is configured */}
        {isGoogleAuthEnabled && (
          <button
            type="button"
            onClick={async () => {
              try {
                await signIn("google", {
                  callbackUrl: safeNextPath,
                  redirect: true,
                });
              } catch {
                void showFeedbackAlert({
                  title: "Login Google gagal",
                  text: "Terjadi kesalahan saat login dengan Google. Silakan coba lagi atau gunakan email/password.",
                  icon: "error",
                });
              }
            }}
            disabled={isFormDisabled}
            className={altActionClassName}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
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
            Masuk dengan Google
          </button>
        )}

        <p className="pt-1 text-center text-sm text-slate-600">{dictionary.noAccount}</p>
        <div className="space-y-2">
          <Link href={signupHref} className={altActionClassName}>
            {dictionary.signup}
          </Link>
        </div>
      </motion.form>
    </AuthShell>
  );
}
