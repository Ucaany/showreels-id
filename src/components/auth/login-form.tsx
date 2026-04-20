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

export function LoginForm() {
  const { dictionary } = usePreferences();
  const [submitError, setSubmitError] = useState("");
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

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
