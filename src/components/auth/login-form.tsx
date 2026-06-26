"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, LockKeyhole } from "lucide-react";
import { signIn, signOut } from "next-auth/react";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthDivider } from "@/components/auth-divider";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useAuthAttemptLock } from "@/hooks/use-auth-attempt-lock";
import { useToast } from "@/hooks/use-toast";
import { usePreferences } from "@/hooks/use-preferences";
import { showFeedbackAlert } from "@/lib/feedback-alert";
import { signInSchema } from "@/lib/auth-schemas";
import { getSafeNextPath } from "@/lib/safe-next-path";

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAADrnxoPouem5cNLb";

type LoginValues = z.infer<typeof signInSchema>;

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
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const safeNextPath = getSafeNextPath(nextPath);
  const googleEnabled = useMemo(() => isGoogleEnabled(), []);
  const signupHref =
    safeNextPath === "/dashboard"
      ? "/auth/signup"
      : `/auth/signup?next=${encodeURIComponent(safeNextPath)}`;
  const forgotHref =
    safeNextPath === "/dashboard"
      ? "/auth/forgot-password"
      : `/auth/forgot-password?next=${encodeURIComponent(safeNextPath)}`;

  const form = useForm<LoginValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const isFormDisabled = form.formState.isSubmitting || authLock.isLocked;

  useEffect(() => {
    if (!oauthError) return;
    void showFeedbackAlert({
      title: dictionary.authLoginOauthErrorTitle,
      text: dictionary.authLoginOauthErrorText,
      icon: "warning",
    });
  }, [oauthError, dictionary]);

  useEffect(() => {
    const scriptId = "cf-turnstile-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const tryRender = () => {
      if (
        typeof window !== "undefined" &&
        window.turnstile &&
        turnstileRef.current &&
        !widgetIdRef.current
      ) {
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token: string) => setTurnstileToken(token),
          "expired-callback": () => setTurnstileToken(null),
          "error-callback": () => setTurnstileToken(null),
          theme: "auto",
        });
      } else if (!widgetIdRef.current) {
        setTimeout(tryRender, 300);
      }
    };

    tryRender();

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", {
        callbackUrl: safeNextPath,
        redirect: true,
      });
    } catch {
      setIsGoogleLoading(false);
      void showFeedbackAlert({
        title: dictionary.authLoginGoogleFailedTitle,
        text: dictionary.authLoginGoogleFailedText,
        icon: "error",
      });
    }
  };

  const onInvalidSubmit = () => {
    const attempt = authLock.registerFailure();
    if (attempt.isLocked) {
      toast.error(dictionary.authLoginLockedTitle, attempt.message);
      return;
    }
    toast.error(dictionary.authLoginInvalid, dictionary.authLoginInvalidHint);
  };

  const onSubmit = async (values: LoginValues) => {
    if (authLock.isLocked) {
      toast.error(dictionary.authLoginLockedTitle, authLock.lockMessage);
      return;
    }

    if (!turnstileToken) {
      toast.error("Verifikasi gagal", "Selesaikan verifikasi captcha terlebih dahulu.");
      return;
    }

    const verifyRes = await fetch("/api/auth/verify-turnstile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: turnstileToken }),
    });

    if (!verifyRes.ok) {
      setTurnstileToken(null);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
      toast.error("Verifikasi gagal", "Captcha tidak valid, silakan coba lagi.");
      return;
    }

    const result = await signIn("credentials", {
      redirect: false,
      email: values.email,
      password: values.password,
    });

    if (result?.error) {
      const attempt = authLock.registerFailure();
      if (attempt.isLocked) {
        toast.error(dictionary.authLoginLockedTitle, attempt.message);
        return;
      }
      toast.error(dictionary.authLoginWrongCreds, dictionary.authLoginInvalidHint);
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
      const isBlocked = bootstrapPayload?.code === "account_blocked";
      const message = isBlocked
        ? dictionary.authLoginBlockedMessage
        : bootstrapPayload?.error || dictionary.authLoginBootstrapFailed;
      void showFeedbackAlert({
        title: isBlocked
          ? dictionary.authLoginBlockedTitle
          : dictionary.authLoginHeldTitle,
        text: message,
        icon: isBlocked ? "warning" : "error",
      });
      return;
    }

    authLock.clearFailures();
    window.location.replace(bootstrapPayload?.redirectTo || "/dashboard");
  };

  return (
    <AuthShell
      title={dictionary.authLoginTitle}
      subtitle={dictionary.authLoginSubtitle}
      showPreferences={false}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {googleEnabled ? (
          <>
          <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isFormDisabled}
              className="h-11 w-full gap-2.5 rounded-xl text-sm font-medium"
            >
              <GoogleIcon className="h-[18px] w-[18px]" aria-hidden="true" />
              {isGoogleLoading ? dictionary.authGoogleConnecting : "Google"}
            </Button>
            <AuthDivider>{dictionary.authDividerLogin}</AuthDivider>
          </>
        ) : null}

        <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[0.8rem] font-medium text-ink/70">
              {dictionary.authLoginEmailLabel}
            </label>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <Mail className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                type="email"
                placeholder={dictionary.authLoginEmailPlaceholder}
                disabled={isFormDisabled}
                aria-invalid={!!form.formState.errors.email}
                {...form.register("email")}
              />
            </InputGroup>
          </div>

          <div className="space-y-1.5">
            <label className="text-[0.8rem] font-medium text-ink/70">
              {dictionary.authLoginPasswordLabel}
            </label>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <LockKeyhole className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                type={showPassword ? "text" : "password"}
                placeholder={dictionary.authLoginPasswordPlaceholder}
                disabled={isFormDisabled}
                aria-invalid={!!form.formState.errors.password}
                {...form.register("password")}
              />
              <InputGroupAddon align="inline-end">
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="inline-flex items-center justify-center text-ink/40 hover:text-ink/70 transition-colors"
                  aria-label={showPassword ? dictionary.authHidePassword : dictionary.authShowPassword}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </InputGroupAddon>
            </InputGroup>
          </div>

          <div className="flex justify-end">
            <Link
              href={forgotHref}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              {dictionary.authForgotPasswordLink}
            </Link>
          </div>

          <Button
            className="h-11 w-full rounded-xl bg-ink text-white shadow-button hover:bg-ink-soft transition-all text-sm font-medium"
            type="submit"
            disabled={isFormDisabled}
          >
            {authLock.isLocked
              ? dictionary.authLoginLocked
              : form.formState.isSubmitting
                ? dictionary.authLoginProcessing
                : dictionary.authLoginButton}
          </Button>
        </form>

        <div ref={turnstileRef} className="flex justify-center" />

        <p className="pt-1 text-center text-[0.82rem] text-ink/60">
          {dictionary.authNoAccountText}{" "}
          <Link href={signupHref} className="font-medium text-ink hover:text-brand-600 transition-colors">
            {dictionary.authSignupNowLink}
          </Link>
        </p>

        <p className="pt-1 text-center text-[0.72rem] leading-relaxed text-ink/40">
          {dictionary.authTermsLoginLead}{" "}
          <Link href="/legal/terms" className="font-medium text-ink/60 hover:text-ink transition-colors">
            {dictionary.authTermsLink}
          </Link>{" "}
          {dictionary.authTermsAnd}{" "}
          <Link href="/legal/privacy" className="font-medium text-ink/60 hover:text-ink transition-colors">
            {dictionary.authPrivacyLink}
          </Link>
          {dictionary.authTermsTail}
        </p>
      </motion.div>
    </AuthShell>
  );
}
