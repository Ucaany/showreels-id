import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { isGoogleAuthEnabled } from "@/lib/auth-config";
import { getCurrentUser } from "@/server/current-user";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await getCurrentUser();
  const googleEnabled = isGoogleAuthEnabled();

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
