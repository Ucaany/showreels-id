"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, LockKeyhole, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { usePreferences } from "@/hooks/use-preferences";
import { useToast } from "@/hooks/use-toast";
import { getSafeNextPath } from "@/lib/safe-next-path";

export function ResetPasswordForm({
  token,
  nextPath = "/auth/login",
}: {
  token: string;
  nextPath?: string;
}) {
  const { dictionary } = usePreferences();
  const toast = useToast();
  const safeNextPath = getSafeNextPath(nextPath);
  const loginHref =
    safeNextPath === "/auth/login"
      ? "/auth/login"
      : `/auth/login?next=${encodeURIComponent(safeNextPath)}`;
  const forgotHref =
    safeNextPath === "/auth/login"
      ? "/auth/forgot-password"
      : `/auth/forgot-password?next=${encodeURIComponent(safeNextPath)}`;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(token.length < 10);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.warning(
        dictionary.authNewPasswordMinHint.split(".")[0] || "Password minimal 8 karakter.",
        dictionary.authNewPasswordMinHint
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.warning(
        dictionary.authNewPasswordMismatchHint.split(".")[0] ||
          "Konfirmasi password tidak sama.",
        dictionary.authNewPasswordMismatchHint
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = (await res.json().catch(() => null)) as
        | { error?: string; code?: string }
        | null;

      if (!res.ok) {
        if (data?.code === "invalid_token") {
          setInvalidToken(true);
          toast.error(
            dictionary.authNewPasswordInvalidTokenTitle,
            dictionary.authNewPasswordInvalidTokenHint
          );
        } else {
          toast.error(
            dictionary.authResetSendFailedTitle,
            data?.error || dictionary.authResetSendFailed
          );
        }
        return;
      }

      setIsSuccess(true);
      toast.success(
        dictionary.authNewPasswordSuccessTitle,
        dictionary.authNewPasswordSuccessHint
      );
    } catch {
      toast.error(
        dictionary.authResetNetworkErrorTitle,
        dictionary.authResetNetworkError
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={dictionary.authNewPasswordTitle}
      subtitle={dictionary.authNewPasswordSubtitle}
      showPreferences={false}
    >
      <AnimatePresence mode="wait">
        {invalidToken ? (
          <motion.div
            key="invalid"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <p className="text-center text-sm text-ink/70">
              {dictionary.authNewPasswordInvalidTokenHint}
            </p>
            <Button
              onClick={() => (window.location.href = forgotHref)}
              className="h-11 w-full rounded-xl bg-ink text-white shadow-button hover:bg-ink-soft transition-all text-sm font-medium"
            >
              {dictionary.authNewPasswordRequestNew}
            </Button>
            <p className="text-center text-[0.82rem] text-ink/60">
              <Link
                href={loginHref}
                className="inline-flex items-center gap-1.5 font-medium text-ink hover:text-brand-600 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {dictionary.authNewPasswordBackToLogin}
              </Link>
            </p>
          </motion.div>
        ) : isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35 }}
            className="space-y-6 py-2 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="text-sm text-ink/70">
              {dictionary.authNewPasswordSuccessHint}
            </p>
            <Link
              href={loginHref}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-ink px-6 text-sm font-medium text-white shadow-button hover:bg-ink-soft transition-all"
            >
              {dictionary.authNewPasswordBackToLogin}
            </Link>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={onSubmit}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-[0.8rem] font-medium text-ink/70">
                {dictionary.authNewPasswordLabel}
              </label>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <LockKeyhole className="h-4 w-4" />
                </InputGroupAddon>
                <InputGroupInput
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={dictionary.authNewPasswordPlaceholder}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <InputGroupAddon align="inline-end">
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="inline-flex items-center justify-center text-ink/40 hover:text-ink/70 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? dictionary.authHidePassword : dictionary.authShowPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <div className="space-y-1.5">
              <label className="text-[0.8rem] font-medium text-ink/70">
                {dictionary.authNewPasswordConfirmLabel}
              </label>
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <LockKeyhole className="h-4 w-4" />
                </InputGroupAddon>
                <InputGroupInput
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={dictionary.authNewPasswordPlaceholder}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <InputGroupAddon align="inline-end">
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="inline-flex items-center justify-center text-ink/40 hover:text-ink/70 transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? dictionary.authHidePassword : dictionary.authShowPassword}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </InputGroupAddon>
              </InputGroup>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !password || !confirmPassword}
              className="h-11 w-full rounded-xl bg-ink text-white shadow-button hover:bg-ink-soft transition-all text-sm font-medium"
            >
              {isSubmitting
                ? dictionary.authNewPasswordSubmitting
                : dictionary.authNewPasswordSubmit}
            </Button>

            <p className="pt-1 text-center text-[0.82rem] text-ink/60">
              <Link
                href={loginHref}
                className="inline-flex items-center gap-1.5 font-medium text-ink hover:text-brand-600 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {dictionary.authNewPasswordBackToLogin}
              </Link>
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
