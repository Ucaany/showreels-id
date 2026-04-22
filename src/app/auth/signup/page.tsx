import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { getCurrentUser } from "@/server/current-user";

export default async function SignupPage() {
  const user = await getCurrentUser();
  const googleEnabled = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  if (user?.id) {
    redirect(user.role === "owner" ? "/admin" : "/dashboard");
  }

  return <SignupForm googleEnabled={googleEnabled} />;
}
