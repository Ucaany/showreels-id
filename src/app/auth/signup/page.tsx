import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { isGoogleAuthEnabled } from "@/lib/auth-config";
import { getCurrentUser } from "@/server/current-user";

export default async function SignupPage() {
  const user = await getCurrentUser();
  const googleEnabled = isGoogleAuthEnabled();

  if (user?.id) {
    redirect(user.role === "owner" ? "/admin" : "/dashboard");
  }

  return <SignupForm googleEnabled={googleEnabled} />;
}
