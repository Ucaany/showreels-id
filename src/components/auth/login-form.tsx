"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useAuthAttemptLock } from "@/hooks/use-auth-attempt-lock";
import { usePreferences } from "@/hooks/use-preferences";
import { getAuthRedirectUrl } from "@/lib/auth-redirect-url";
import { showFeedbackAlert } from "@/lib/feedback-alert";
import { getSafeNextPath } from "@/lib/safe-next-path";
import { cn } from "@/lib/cn";

const loginSchema = z.object({
  email: z.email("Format email belum valid."),
  password: z.string().min(8, "Password minimal 8 karakter."),
});

type LoginValues = z.infer<typeof loginSchema>;

function getOauthErrorMessage(code: string) {
  const normalized = code.trim().toLowerCase();
  if (normalized === "oauthaccountnotlinked") {
    return "Email ini sudah terdaftar dengan metode login lain. Masuk dengan password dulu, lalu coba Google lagi.";
  }
  if (normalized === "accessdenied" || normalized === "access_denied") {
    return "Akses login Google ditolak.";
  }
  if (normalized === "callback") {
    return "Proses callback Google bermasalah. Coba lagi beberapa saat.";
  }
  if (normalized === "account_sync") {
    return "Login berhasil, tetapi profil akun belum bisa disiapkan. Coba lagi beberapa saat.";
  }
  return "";
}

function getCredentialsErrorMessage(
  message?: string | null,
  emailAttempt?: string
) {
  const normalizedEmail = (emailAttempt || "").trim().toLowerCase();
  if (normalizedEmail === "hallo@ucan.com") {
    return "Email owner yang benar adalah hello@ucan.com (pakai huruf e).";
  }

  if (message?.toLowerCase().includes("email not confirmed")) {
    return "Email belum terverifikasi.";
  }

  return "Email atau password tidak cocok.";
}

async function finalizeSignedInSession(nextPath: string) {
  const response = await fetch(
    `/api/auth/bootstrap?next=${encodeURIComponent(nextPath)}`,
    {
    method: "POST",
    }
  );
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; redirectTo?: string; code?: string }
    | null;

  if (!response.ok) {
    if (payload?.code === "account_blocked") {
      return {
        ok: false as const,
        blocked: true,
        message:
          payload.error ||
          "Akun ini sedang diblokir dan belum bisa digunakan.",
      };
    }

    return {
      ok: true as const,
      redirectTo: nextPath,
      degradedSync: true,
    };
  }

  return {
    ok: true as const,
    redirectTo: payload?.redirectTo || "/dashboard",
  };
}

export function LoginForm({
  googleEnabled,
  oauthError = "",
  nextPath = "/dashboard",
}: {
  googleEnabled: boolean;
  oauthError?: string;
  nextPath?: string;
}) {
  const { dictionary } = usePreferences();
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const authLock = useAuthAttemptLock();
  const supabase = createClient();
  const authUnavailable = !supabase;
  const authUnavailableMessage = "Layanan autentikasi belum siap. Coba refresh halaman.";
  const visibleSubmitError = authUnavailable ? authUnavailableMessage : submitError;
  const oauthErrorMessage = getOauthErrorMessage(oauthError);
  const safeNextPath = getSafeNextPath(nextPath);
  const signupHref =
    safeNextPath === "/dashboard"
      ? "/auth/signup"
      : `/auth/signup?next=${encodeURIComponent(safeNextPath)}`;
  const altActionClassName =
    "inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#cad9f4] bg-white px-4 text-sm font-semibold text-[#1b365f] shadow-sm transition hover:bg-[#edf4ff] focus:outline-none focus:ring-2 focus:ring-[#b7d2ff] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const isFormDisabled = form.formState.isSubmitting || authLock.isLocked || authUnavailable;

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
        title: "Login dikunci sementara",
        text: authLock.lockMessage,
        icon: "warning",
      });
      return;
    }

    setSubmitError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        const attempt = authLock.registerFailure();
        const message = getCredentialsErrorMessage(error.message, values.email);
        const visibleMessage = attempt.isLocked ? attempt.message : message;
        setSubmitError(visibleMessage);
        void showFeedbackAlert({
          title: attempt.isLocked ? "Login dikunci sementara" : "Login gagal",
          text: visibleMessage,
          icon: attempt.isLocked ? "warning" : "error",
        });
        return;
      }

      const bootstrapResult = await finalizeSignedInSession(safeNextPath);

      if (!bootstrapResult.ok) {
        if (bootstrapResult.blocked) {
          await supabase.auth.signOut();
        }
        setSubmitError(bootstrapResult.message);
        void showFeedbackAlert({
          title: bootstrapResult.blocked ? "Akun diblokir" : "Login tertahan",
          text: bootstrapResult.message,
          icon: "warning",
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
      window.location.replace(bootstrapResult.redirectTo);
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
    if (!oauthErrorMessage) {
      return;
    }

    void showFeedbackAlert({
      title: "Login Google belum berhasil",
      text: oauthErrorMessage,
      icon: "warning",
    });
  }, [oauthErrorMessage]);

  return (
    <AuthShell
      title={dictionary.authLoginTitle}
      subtitle="Masuk dengan tampilan yang lebih ringkas, aman, dan mudah dipahami."
      showPreferences={false}
    >
      <motion.form
        onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)}
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {oauthErrorMessage ? (
          <p className="rounded-2xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {oauthErrorMessage}
          </p>
        ) : null}

        <div className="space-y-2">
          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-[#4c413b]">
            <Mail className="h-4 w-4 text-[#2f73ff]" />
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
            <label className="flex items-center gap-2 text-sm font-medium text-[#4c413b]">
              <LockKeyhole className="h-4 w-4 text-[#2f73ff]" />
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-xs font-semibold text-[#2f73ff] hover:text-[#225fe0]"
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
              className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-[#5a78ad] transition hover:text-[#2f73ff]"
              aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.password?.message}
          </p>
        </div>

        {authLock.lockMessage || visibleSubmitError ? (
          <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {authLock.lockMessage || visibleSubmitError}
          </p>
        ) : null}

        <Button
          className="w-full bg-[#2f73ff] text-white hover:bg-[#225fe0] focus-visible:ring-[#8eb3ff]"
          type="submit"
          disabled={isFormDisabled}
        >
          {authLock.isLocked
            ? "Login terkunci"
            : form.formState.isSubmitting
              ? "Memproses..."
              : dictionary.login}
        </Button>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 pt-1 text-xs text-[#7f726a]">
          <span className="h-px bg-[#e0d6d0]" />
          <span>atau</span>
          <span className="h-px bg-[#e0d6d0]" />
        </div>
        <p className="pt-1 text-center text-sm text-[#5b7095]">{dictionary.noAccount}</p>
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
                    title: "Login dikunci sementara",
                    text: authLock.lockMessage,
                    icon: "warning",
                  });
                  return;
                }

                const { data, error } = await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    redirectTo: getAuthRedirectUrl(safeNextPath),
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
                      ? "Login dikunci sementara"
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
          <Link href={signupHref} className={altActionClassName}>
            {dictionary.signup}
          </Link>
        </div>
      </motion.form>
    </AuthShell>
  );
}

