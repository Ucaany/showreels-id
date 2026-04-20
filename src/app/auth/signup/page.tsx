import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignupForm } from "@/components/auth/signup-form";
import { isAdminEmail } from "@/server/admin-access";

export default async function SignupPage() {
  const session = await auth();
  const googleEnabled = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
  );

  if (session?.user) {
    redirect(isAdminEmail(session.user.email) ? "/admin" : "/dashboard");
  }

  return <SignupForm googleEnabled={googleEnabled} />;
}
