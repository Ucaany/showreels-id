import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { isGoogleAuthEnabled } from "@/lib/auth-config";
import { getSafeNextPath } from "@/lib/safe-next-path";
import { getCurrentUser } from "@/server/current-user";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await getCurrentUser();
  const googleEnabled = isGoogleAuthEnabled();
  const nextPath = getSafeNextPath(resolvedSearchParams.next);

  if (user?.id) {
    redirect(user.role === "owner" ? "/admin" : nextPath);
  }

  return (
    <LoginForm
      googleEnabled={googleEnabled}
      nextPath={nextPath}
      oauthError={
        typeof resolvedSearchParams.error === "string"
          ? resolvedSearchParams.error
          : ""
      }
    />
  );
}
