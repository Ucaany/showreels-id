"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Globe2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePreferences } from "@/hooks/use-preferences";

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
  return "";
}

export function LoginForm({
  googleEnabled,
  oauthError = "",
}: {
  googleEnabled: boolean;
  oauthError?: string;
}) {
  const { dictionary } = usePreferences();
  const [submitError, setSubmitError] = useState("");
  const oauthErrorMessage = getOauthErrorMessage(oauthError);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError("");
    const result = await signIn("credentials", {
      ...values,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (!result || result.error) {
      setSubmitError("Email atau password tidak cocok.");
      return;
    }

    window.location.assign(result.url ?? "/dashboard");
  });

  return (
    <AuthShell
      title={dictionary.authLoginTitle}
      subtitle={dictionary.authLoginSubtitle}
    >
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {oauthErrorMessage ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {oauthErrorMessage}
          </p>
        ) : null}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Email
          </label>
          <Input placeholder="nama@email.com" {...form.register("email")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.email?.message}
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Password
          </label>
          <Input type="password" placeholder="********" {...form.register("password")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.password?.message}
          </p>
        </div>

        {submitError ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {submitError}
          </p>
        ) : null}

        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Memproses..." : dictionary.login}
        </Button>

        {googleEnabled ? (
          <>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 pt-1 text-xs text-slate-500">
              <span className="h-px bg-slate-200" />
              <span>atau</span>
              <span className="h-px bg-slate-200" />
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() =>
                signIn("google", {
                  callbackUrl: "/dashboard",
                  prompt: "select_account",
                })
              }
            >
              <Globe2 className="h-4 w-4" />
              {dictionary.continueGoogle}
            </Button>
          </>
        ) : null}
      </motion.form>

      <p className="mt-5 text-center text-sm text-slate-600">
        {dictionary.noAccount}{" "}
        <Link href="/auth/signup" className="font-semibold text-brand-600">
          {dictionary.signup}
        </Link>
      </p>
    </AuthShell>
  );
}
