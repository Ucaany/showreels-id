import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/server/current-user";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await getCurrentUser();
  const googleEnabled = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  if (user?.id) {
    redirect(user.role === "owner" ? "/admin" : "/dashboard");
  }

  return (
    <LoginForm
      googleEnabled={googleEnabled}
      oauthError={
        typeof resolvedSearchParams.error === "string"
          ? resolvedSearchParams.error
          : ""
      }
    />
  );
}
