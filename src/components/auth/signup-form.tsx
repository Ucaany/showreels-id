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
import { AuthDivider } from "@/components/auth-divider";
import { GoogleIcon } from "@/components/icons/google-icon";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useAuthAttemptLock } from "@/hooks/use-auth-attempt-lock";
import { usePreferences } from "@/hooks/use-preferences";
import { useToast } from "@/hooks/use-toast";
import { signUpSchema } from "@/lib/auth-schemas";
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
      toast.error(dictionary.authSignupLockedTitle, attempt.message);
      return;
    }
    toast.error(dictionary.authSignupInvalid, dictionary.authSignupInvalidHint);
  };

  const onSubmit = async (values: SignupValues) => {
    if (authLock.isLocked) {
      toast.error(dictionary.authSignupLockedTitle, authLock.lockMessage);
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
          toast.error(dictionary.authSignupLockedTitle, attempt.message);
          return;
        }
        toast.error(
          getRegisterErrorMessage(dictionary, registerPayload),
          dictionary.authSignupInvalidHint
        );
        return;
      }

      const signInResult = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
      });

      if (signInResult?.error) {
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
          : bootstrapPayload?.error || dictionary.authSignupSetupIncomplete;
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
      toast.error(
        dictionary.authSignupCatchError,
        dictionary.authSignupInvalidHint
      );
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
        className="space-y-4"
      >
        {googleEnabled ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignup}
              disabled={isGoogleLoading || isFormDisabled}
              className="h-11 w-full gap-2.5 rounded-xl text-sm font-medium"
            >
              <GoogleIcon className="h-[18px] w-[18px]" aria-hidden="true" />
              {isGoogleLoading ? dictionary.authGoogleConnecting : "Google"}
            </Button>
            <AuthDivider>{dictionary.authDividerSignup}</AuthDivider>
          </>
        ) : null}

        <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="text-[0.8rem] font-medium text-ink/70">
              {dictionary.authSignupFullNameLabel}
            </label>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <UserRound className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                disabled={isFormDisabled}
                aria-invalid={!!form.formState.errors.fullName}
                {...form.register("fullName")}
              />
            </InputGroup>
          </div>

          <div className="space-y-1.5">
            <label className="text-[0.8rem] font-medium text-ink/70">
              {dictionary.authSignupEmailLabel}
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
              {dictionary.authSignupPasswordLabel}
            </label>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <LockKeyhole className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                type={showPassword ? "text" : "password"}
                placeholder={dictionary.authSignupPasswordPlaceholder}
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
            {form.formState.errors.password ? (
              <p className="text-xs text-rose-500">{form.formState.errors.password.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-[0.8rem] font-medium text-ink/70">
              {dictionary.authSignupConfirmPasswordLabel}
            </label>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <LockKeyhole className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                type={showConfirmPassword ? "text" : "password"}
                placeholder={dictionary.authSignupConfirmPasswordPlaceholder}
                disabled={isFormDisabled}
                aria-invalid={!!form.formState.errors.confirmPassword}
                {...form.register("confirmPassword")}
              />
              <InputGroupAddon align="inline-end">
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="inline-flex items-center justify-center text-ink/40 hover:text-ink/70 transition-colors"
                  aria-label={showConfirmPassword ? dictionary.authHidePassword : dictionary.authShowPassword}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </InputGroupAddon>
            </InputGroup>
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

        <p className="pt-1 text-center text-[0.82rem] text-ink/60">
          {dictionary.authHasAccountText}{" "}
          <Link href={loginHref} className="font-medium text-ink hover:text-brand-600 transition-colors">
            {dictionary.authLoginHereLink}
          </Link>
        </p>

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
