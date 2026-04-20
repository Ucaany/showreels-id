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

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Nama minimal 2 karakter."),
    username: z
      .string()
      .min(3, "Username minimal 3 karakter.")
      .regex(/^[a-zA-Z0-9_]+$/, "Gunakan huruf, angka, atau underscore."),
    email: z.email("Format email belum valid."),
    password: z.string().min(8, "Password minimal 8 karakter."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama.",
  });

type SignupValues = z.infer<typeof signupSchema>;

export function SignupForm() {
  const { dictionary } = usePreferences();
  const [submitError, setSubmitError] = useState("");
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError("");
    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (!response.ok) {
      setSubmitError(payload?.error ?? "Gagal membuat akun.");
      return;
    }

    const signInResult = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (!signInResult || signInResult.error) {
      setSubmitError("Akun dibuat, tetapi login otomatis gagal.");
      return;
    }

    window.location.assign(signInResult.url ?? "/dashboard");
  });

  return (
    <AuthShell
      title={dictionary.authSignupTitle}
      subtitle={dictionary.authSignupSubtitle}
    >
      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {googleEnabled ? (
          <>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            >
              <Globe2 className="h-4 w-4" />
              {dictionary.continueGoogle}
            </Button>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs text-slate-500">
              <span className="h-px bg-slate-200" />
              <span>atau</span>
              <span className="h-px bg-slate-200" />
            </div>
          </>
        ) : null}

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Nama Lengkap
          </label>
          <Input {...form.register("fullName")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.fullName?.message}
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Username
          </label>
          <Input {...form.register("username")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.username?.message}
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Email
          </label>
          <Input {...form.register("email")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.email?.message}
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Password
          </label>
          <Input type="password" {...form.register("password")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.password?.message}
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Konfirmasi Password
          </label>
          <Input type="password" {...form.register("confirmPassword")} />
          <p className="mt-1 text-xs text-rose-600">
            {form.formState.errors.confirmPassword?.message}
          </p>
        </div>

        {submitError ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {submitError}
          </p>
        ) : null}

        <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Membuat akun..." : dictionary.signup}
        </Button>
      </motion.form>

      <p className="mt-5 text-center text-sm text-slate-600">
        {dictionary.hasAccount}{" "}
        <Link href="/auth/login" className="font-semibold text-brand-600">
          {dictionary.login}
        </Link>
      </p>
    </AuthShell>
  );
}
