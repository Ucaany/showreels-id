"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { signIn, signOut } from "next-auth/react";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthAttemptLock } from "@/hooks/use-auth-attempt-lock";
import { usePreferences } from "@/hooks/use-preferences";
import { cn } from "@/lib/cn";
import { DEMO_MODE } from "@/lib/demo-mode";
import { showFeedbackAlert } from "@/lib/feedback-alert";
import { signInSchema } from "@/lib/auth-schemas";
import { getSafeNextPath } from "@/lib/safe-next-path";

const demoLoginSchema = z.object({
  email: z.string().email("Format email belum valid."),
  password: z.string().min(1, "Password wajib diisi."),
});

type LoginValues = z.infer<typeof signInSchema>;
type DemoLoginValues = z.infer<typeof demoLoginSchema>;

function isGoogleEnabled() {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true"
  );
}

export function LoginForm({
  oauthError = "",
  nextPath = "/dashboard",
}: {
  oauthError?: string;
  nextPath?: string;
}) {
  const { dictionary } = usePreferences();
  const authLock = useAuthAttemptLock();
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const safeNextPath = getSafeNextPath(nextPath);
  const googleEnabled = useMemo(() => isGoogleEnabled(), []);
  const signupHref =
    safeNextPath === "/dashboard"
      ? "/auth/signup"
      : `/auth/signup?next=${encodeURIComponent(safeNextPath)}`;

  const productionForm = useForm<LoginValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const demoForm = useForm<DemoLoginValues>({
    resolver: zodResolver(demoLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const demoDisabled = demoForm.formState.isSubmitting;
  const isFormDisabled = productionForm.formState.isSubmitting || authLock.isLocked;

  useEffect(() => {
    if (!oauthError) return;
    void showFeedbackAlert({
      title: "Login belum berhasil",
      text: "Terjadi kesalahan saat proses autentikasi.",
      icon: "warning",
    });
  }, [oauthError]);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setSubmitError("");

    try {
      await signIn("google", {
        callbackUrl: safeNextPath,
        redirect: true,
      });
    } catch {
      setIsGoogleLoading(false);
      void showFeedbackAlert({
        title: "Login Google gagal",
        text: "Terjadi kendala saat menghubungkan akun Google. Silakan coba lagi.",
        icon: "error",
      });
    }
  };

  const onDemoSubmit = async (values: DemoLoginValues) => {
    setSubmitError("");

    try {
      const response = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string; user?: { name?: string }; redirectTo?: string }
        | null;

      if (!response.ok) {
        const message = payload?.error || "Email atau password tidak cocok.";
        setSubmitError(message);
        void showFeedbackAlert({
          title: "Login gagal",
          text: message,
          icon: "error",
        });
        return;
      }

      await showFeedbackAlert({
        title: "Berhasil login",
        text: `Selamat datang, ${payload?.user?.name || "User"}!`,
        icon: "success",
        confirmButtonText: "Lanjut",
      });
      window.location.replace(payload?.redirectTo || "/dashboard");
    } catch {
      setSubmitError("Login demo belum bisa diproses. Coba lagi.");
    }
  };

  const onInvalidSubmit = () => {
    const attempt = authLock.registerFailure();
    const message = attempt.isLocked
      ? attempt.message
      : "Periksa kembali email dan password yang diisi.";

    setSubmitError(message);
  };

  const onSubmit = async (values: LoginValues) => {
    if (authLock.isLocked) {
      setSubmitError(authLock.lockMessage);
      return;
    }

    setSubmitError("");

    const result = await signIn("credentials", {
      redirect: false,
      email: values.email,
      password: values.password,
    });

    if (result?.error) {
      const attempt = authLock.registerFailure();
      const message = attempt.isLocked
        ? attempt.message
        : "Email atau password belum cocok.";
      setSubmitError(message);
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
      await signOut({ redirect: false });

      const message =
        bootstrapPayload?.error ||
        "Akun berhasil diverifikasi, tetapi dashboard belum siap dibuka.";
      setSubmitError(message);
      void showFeedbackAlert({
        title:
          bootstrapPayload?.code === "account_blocked"
            ? "Akun diblokir"
            : "Login tertahan",
        text: message,
        icon: bootstrapPayload?.code === "account_blocked" ? "warning" : "error",
      });
      return;
    }

    authLock.clearFailures();
    window.location.replace(bootstrapPayload?.redirectTo || "/dashboard");
  };

  return (
    <AuthShell
      title={dictionary.authLoginTitle}
      subtitle="Masuk dengan email dan password, atau gunakan Google jika ingin lanjut lebih cepat."
      showPreferences={false}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-5"
      >
        {DEMO_MODE ? (
          <>
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
              <p className="font-semibold">Demo mode aktif</p>
              <p className="mt-2 text-xs leading-6 text-emerald-800">
                Admin: <span className="font-mono">admin@showreels.id / admin123</span>
                <br />
                Creator: <span className="font-mono">creator@showreels.id / creator123</span>
              </p>
            </div>

            <form
              onSubmit={demoForm.handleSubmit(onDemoSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2 rounded-3xl border border-zinc-200 bg-zinc-50/70 p-4">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                  <Mail className="h-4 w-4 text-orange-600" />
                  Email
                </label>
                <Input
                  placeholder="nama@email.com"
                  disabled={demoDisabled}
                  className={cn(
                    demoForm.formState.errors.email &&
                      "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
                  )}
                  {...demoForm.register("email")}
                />
                {demoForm.formState.errors.email ? (
                  <p className="text-xs text-rose-600">
                    {demoForm.formState.errors.email.message}
                  </p>
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
                    placeholder="Masukkan password"
                    disabled={demoDisabled}
                    className={cn(
                      "pr-11",
                      demoForm.formState.errors.password &&
                        "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
                    )}
                    {...demoForm.register("password")}
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
                {demoForm.formState.errors.password ? (
                  <p className="text-xs text-rose-600">
                    {demoForm.formState.errors.password.message}
                  </p>
                ) : null}
              </div>

              {submitError ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {submitError}
                </p>
              ) : null}

              <Button
                className="h-11 w-full rounded-2xl bg-orange-600 text-white hover:bg-orange-700"
                type="submit"
                disabled={demoDisabled}
              >
                {demoForm.formState.isSubmitting ? "Memproses..." : "Masuk demo"}
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-50 via-white to-orange-50 px-5 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-zinc-950">
                    Login creator dan owner sekarang memakai email + password
                  </p>
                  <p className="text-sm leading-6 text-zinc-600">
                    User baru bisa daftar sendiri dengan username, email, dan password.
                    Akun owner masuk memakai kredensial yang sudah disiapkan sistem.
                  </p>
                  <div className="rounded-2xl border border-orange-200 bg-white/90 px-3 py-3 text-xs leading-6 text-zinc-700">
                    <p className="font-semibold text-zinc-950">Akses owner</p>
                    <p>
                      Email: <span className="font-mono">hello@ucan.com</span>
                    </p>
                    <p>
                      Password: <span className="font-mono">Ucan301026.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <form
              onSubmit={productionForm.handleSubmit(onSubmit, onInvalidSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2 rounded-3xl border border-zinc-200 bg-zinc-50/70 p-4">
                <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                  <Mail className="h-4 w-4 text-orange-600" />
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="nama@email.com"
                  disabled={isFormDisabled}
                  className={cn(
                    productionForm.formState.errors.email &&
                      "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
                  )}
                  {...productionForm.register("email")}
                />
                {productionForm.formState.errors.email ? (
                  <p className="text-xs text-rose-600">
                    {productionForm.formState.errors.email.message}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 rounded-3xl border border-zinc-200 bg-zinc-50/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                    <LockKeyhole className="h-4 w-4 text-orange-600" />
                    Password
                  </label>
                  <span className="text-xs text-zinc-500">Minimal 8 karakter</span>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    disabled={isFormDisabled}
                    className={cn(
                      "pr-11",
                      productionForm.formState.errors.password &&
                        "border-rose-300 focus:border-rose-500 focus:ring-rose-200"
                    )}
                    {...productionForm.register("password")}
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
                {productionForm.formState.errors.password ? (
                  <p className="text-xs text-rose-600">
                    {productionForm.formState.errors.password.message}
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
                  ? "Login terkunci"
                  : productionForm.formState.isSubmitting
                    ? "Masuk..."
                    : "Masuk ke dashboard"}
              </Button>
            </form>

            <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50/70 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-950">
                    Belum punya akun creator?
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Daftar dengan username dan password, lalu lanjutkan ke onboarding.
                  </p>
                </div>
                <Link
                  href={signupHref}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                >
                  Daftar
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {googleEnabled ? (
              <>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs text-zinc-500">
                  <span className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-orange-100" />
                  <span>atau</span>
                  <span className="h-px bg-gradient-to-r from-orange-100 via-zinc-200 to-transparent" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || isFormDisabled}
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
                  {isGoogleLoading ? "Menghubungkan..." : "Lanjutkan dengan Google"}
                </button>
              </>
            ) : null}

            <p className="text-center text-xs leading-6 text-zinc-500">
              Dengan masuk, kamu menyetujui{" "}
              <Link href="/legal/terms" className="font-semibold text-orange-600 hover:underline">
                Syarat & Ketentuan
              </Link>{" "}
              dan{" "}
              <Link href="/legal/privacy" className="font-semibold text-orange-600 hover:underline">
                Kebijakan Privasi
              </Link>
              .
            </p>
          </>
        )}
      </motion.div>
    </AuthShell>
  );
}
