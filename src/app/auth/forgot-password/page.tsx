import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getSafeNextPath } from "@/lib/safe-next-path";
import { getCurrentUser } from "@/server/current-user";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const nextPath = getSafeNextPath(params.next);

  if (user?.id) {
    redirect(user.role === "owner" ? "/admin" : nextPath);
  }

  return <ForgotPasswordForm nextPath={nextPath} />;
}
