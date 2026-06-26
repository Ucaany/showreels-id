"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MailCheck, ArrowLeft, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePreferences } from "@/hooks/use-preferences";
import { useToast } from "@/hooks/use-toast";
import { getSafeNextPath } from "@/lib/safe-next-path";

export function ForgotPasswordForm({
  nextPath = "/auth/login",
}: {
  nextPath?: string;
}) {
  const { dictionary } = usePreferences();
  const safeNextPath = getSafeNextPath(nextPath);
  const loginHref =
    safeNextPath === "/auth/login"
      ? "/auth/login"
      : `/auth/login?next=${encodeURIComponent(safeNextPath)}`;

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const toast = useToast();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error(
        dictionary.authResetEmailRequiredTitle,
        dictionary.authResetEmailRequiredHint
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = (await res.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!res.ok) {
        toast.error(
          dictionary.authResetSendFailedTitle,
          data?.error || dictionary.authResetSendFailed
        );
      } else {
        setSentEmail(email);
      }
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
      title={dictionary.authResetTitle}
      subtitle={
        sentEmail
          ? dictionary.authResetSentSubtitle
          : dictionary.authResetSubtitle
      }
      showPreferences={false}
    >
      <AnimatePresence mode="wait">
        {!sentEmail ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[0.8rem] font-medium text-ink/70">
                  <Mail className="h-3.5 w-3.5 text-ink/50" />
                  {dictionary.authResetEmailLabel}
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={dictionary.authResetEmailPlaceholder}
                  disabled={isSubmitting}
                  className="h-11 rounded-xl border-black/[0.08] bg-white text-sm transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="h-11 w-full rounded-xl bg-ink text-white shadow-button hover:bg-ink-soft transition-all text-sm font-medium"
              >
                {isSubmitting
                  ? dictionary.authResetSending
                  : dictionary.authResetButton}
              </Button>
            </form>

            {/* Back to login */}
            <p className="pt-1 text-center text-[0.82rem] text-ink/60">
              {dictionary.authResetRememberText}{" "}
              <Link
                href={loginHref}
                className="font-medium text-ink hover:text-brand-600 transition-colors"
              >
                {dictionary.authResetBackToLogin}
              </Link>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35 }}
            className="space-y-6 py-2 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <MailCheck className="h-7 w-7" />
            </div>

            <div className="space-y-1.5">
              <p className="text-[0.92rem] leading-relaxed text-ink/60">
                {dictionary.authResetEmailSentPrefix}
              </p>
              <p className="text-sm font-semibold text-ink">{sentEmail}</p>
            </div>

            <p className="text-xs leading-relaxed text-ink/40">
              {dictionary.authResetCheckSpamLead}{" "}
              {dictionary.authResetCheckSpamTail}
            </p>

            <Button
              onClick={() => setSentEmail(null)}
              className="mx-auto h-10 rounded-xl border border-black/[0.08] bg-white px-4 text-sm font-medium text-ink/80 hover:bg-black/[0.02]"
            >
              {dictionary.authResetResend}
            </Button>

            <Link
              href={loginHref}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/50 hover:text-ink/80 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {dictionary.authResetBackToLogin}
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
