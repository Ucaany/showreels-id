import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { isGoogleAuthEnabled } from "@/lib/auth-config";
import { getSafeNextPath } from "@/lib/safe-next-path";
import { getCurrentUser } from "@/server/current-user";
import { sanitizeUsername } from "@/lib/username-rules";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ username?: string; next?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const googleEnabled = isGoogleAuthEnabled();
  const prefilledUsername = sanitizeUsername(params.username || "");
  const nextPath = getSafeNextPath(params.next);

  if (user?.id) {
    redirect(user.role === "owner" ? "/admin" : nextPath);
  }

  return (
    <SignupForm
      googleEnabled={googleEnabled}
      initialUsername={prefilledUsername}
      nextPath={nextPath}
    />
  );
}
