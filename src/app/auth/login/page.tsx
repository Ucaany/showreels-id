import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/login-form";
import { isAdminEmail } from "@/server/admin-access";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const session = await auth();
  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
  );

  if (session?.user) {
    redirect(isAdminEmail(session.user.email) ? "/admin" : "/dashboard");
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
