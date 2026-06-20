"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthAttemptLock } from "@/hooks/use-auth-attempt-lock";
import { usePreferences } from "@/hooks/use-preferences";
import { useToast } from "@/hooks/use-toast";
import { signUpSchema } from "@/lib/auth-schemas";
import { cn } from "@/lib/cn";
import { showFeedbackAlert } from "@/lib/feedback-alert";
import { getRegisterErrorMessage } from "@/lib/i18n";
import { getSafeNextPath } from "@/lib/safe-next-path";

type SignupValues = z.infer<typeof signUpSchema>;

function isGoogleEnabled() {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH === "true"
  );
}

export function SignupForm({
  nextPath = "/dashboard",
}: {
  nextPath?: string;
}) {
  const { dictionary } = usePreferences();
  const authLock = useAuthAttemptLock();
  const toast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
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
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const isFormDisabled = form.formState.isSubmitting || authLock.isLocked;

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);

    try {
      await signIn("google", {
        callbackUrl: safeNextPath,
        redirect: true,
      });
    } catch {
      setIsGoogleLoading(false);
      void showFeedbackAlert({
        title: dictionary.authGoogleSignupFailedTitle,
        text: dictionary.authGoogleSignupFailedText,
        icon: "error",
      });
    }
  };

  const onInvalidSubmit = () => {
    const attempt = authLock.registerFailure();
    if (attempt.isLocked) {
      toast.error(dictionary.authSignupLockedTitle, dictionary.authLoginLockedHint);
      return;
    }
    toast.error(dictionary.authSignupInvalid);
  };

  const onSubmit = async (values: SignupValues) => {
    if (authLock.isLocked) {
      toast.error(dictionary.authSignupLockedTitle, dictionary.authLoginLockedHint);
      return;
    }

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
        if (attempt.isLocked) {
          toast.error(dictionary.authSignupLockedTitle, dictionary.authLoginLockedHint);
          return;
        }
        toast.error(getRegisterErrorMessage(dictionary, registerPayload));
        return;
      }

      const signInResult = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (signInResult?.error) {
        const isServerLocked =
          typeof signInResult.error === "string" &&
          signInResult.error.toLowerCase().includes("rate");

        if (isServerLocked) {
          authLock.forceLock();
          toast.error(
            dictionary.authSignupLockedTitle,
            dictionary.authLoginLockedHint
          );
          return;
        }

        authLock.clearFailures();
        void showFeedbackAlert({
          title: dictionary.authSignupAutoLoginTitle,
          text: dictionary.authSignupAutoLoginText,
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
        const isBlocked = bootstrapPayload?.code === "account_blocked";
        const message = isBlocked
          ? dictionary.authSignupBlockedMessage
          : bootstrapPayload?.error ||
            dictionary.authSignupSetupIncomplete;
        void showFeedbackAlert({
          title: isBlocked
            ? dictionary.authSignupBlockedTitle
            : dictionary.authSignupNotReadyTitle,
          text: message,
          icon: isBlocked ? "warning" : "error",
        });
        return;
      }

      authLock.clearFailures();
      window.location.replace(bootstrapPayload?.redirectTo || "/dashboard");
    } catch {
      toast.error(dictionary.authSignupCatchError);
    }
  };

  return (
    <AuthShell
      title={dictionary.authSignupTitle}
      subtitle={dictionary.authSignupSubtitle}
      showPreferences={false}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-5"
      >
        <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[0.8rem] font-medium text-ink/70">
              <UserRound className="h-3.5 w-3.5 text-ink/50" />
              {dictionary.authSignupFullNameLabel}
            </label>
            <Input
              disabled={isFormDisabled}
              className={cn(
                "h-11 rounded-xl border-black/[0.08] bg-white text-sm transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
                form.formState.errors.fullName && "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
              )}
              {...form.register("fullName")}
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[0.8rem] font-medium text-ink/70">
              <Mail className="h-3.5 w-3.5 text-ink/50" />
              {dictionary.authSignupEmailLabel}
            </label>
            <Input
              type="email"
              placeholder={dictionary.authLoginEmailPlaceholder}
              disabled={isFormDisabled}
              className={cn(
                "h-11 rounded-xl border-black/[0.08] bg-white text-sm transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
                form.formState.errors.email &&
                  "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
              )}
              {...form.register("email")}
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[0.8rem] font-medium text-ink/70">
              <LockKeyhole className="h-3.5 w-3.5 text-ink/50" />
              {dictionary.authSignupPasswordLabel}
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={dictionary.authSignupPasswordPlaceholder}
                disabled={isFormDisabled}
                className={cn(
                  "h-11 rounded-xl border-black/[0.08] bg-white pr-10 text-sm transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
                  form.formState.errors.password &&
                    "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
                )}
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center text-ink/40 hover:text-ink/70 transition-colors"
                aria-label={showPassword ? dictionary.authHidePassword : dictionary.authShowPassword}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.password ? (
              <p className="text-xs text-rose-500">{form.formState.errors.password.message}</p>
            ) : null}
            <label className="flex items-center gap-2 text-[0.8rem] font-medium text-ink/70">
              <LockKeyhole className="h-3.5 w-3.5 text-ink/50" />
              {dictionary.authSignupConfirmPasswordLabel}
            </label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder={dictionary.authSignupConfirmPasswordPlaceholder}
                disabled={isFormDisabled}
                className={cn(
                  "h-11 rounded-xl border-black/[0.08] bg-white pr-10 text-sm transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
                  form.formState.errors.confirmPassword &&
                    "border-rose-300 focus:border-rose-500 focus:ring-rose-100"
                )}
                {...form.register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center justify-center text-ink/40 hover:text-ink/70 transition-colors"
                aria-label={
                  showConfirmPassword ? dictionary.authHidePassword : dictionary.authShowPassword
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            className="h-11 w-full rounded-xl bg-ink text-white shadow-button hover:bg-ink-soft transition-all text-sm font-medium"
            type="submit"
            disabled={isFormDisabled}
          >
            {authLock.isLocked
              ? dictionary.authSignupLocked
              : form.formState.isSubmitting
                ? dictionary.authSignupProcessing
                : dictionary.authSignupButton}
          </Button>
        </form>

        {/* Login link */}
        <p className="pt-1 text-center text-[0.82rem] text-ink/60">
          {dictionary.authHasAccountText}{" "}
          <Link href={loginHref} className="font-medium text-ink hover:text-brand-600 transition-colors">
            {dictionary.authLoginHereLink}
          </Link>
        </p>

        {/* Divider + Google */}
        {googleEnabled ? (
          <>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 pt-2 text-xs text-ink/40">
              <span className="h-px bg-black/[0.08]" />
              <span>{dictionary.authDividerSignup}</span>
              <span className="h-px bg-black/[0.08]" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={isGoogleLoading || isFormDisabled}
              className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-black/[0.08] bg-white px-4 text-sm font-medium text-ink/80 shadow-soft transition hover:bg-black/[0.02] hover:border-black/[0.12] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {isGoogleLoading ? dictionary.authGoogleConnecting : "Google"}
            </button>
          </>
        ) : null}

        {/* Terms */}
        <p className="pt-1 text-center text-[0.72rem] leading-relaxed text-ink/40">
          {dictionary.authTermsSignupLead}{" "}
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
