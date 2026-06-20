import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getSafeNextPath } from "@/lib/safe-next-path";
import { getCurrentUser } from "@/server/current-user";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; next?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const nextPath = getSafeNextPath(params.next);
  const token = (params.token ?? "").trim();

  if (user?.id) {
    redirect(user.role === "owner" ? "/admin" : nextPath);
  }

  return <ResetPasswordForm token={token} nextPath={nextPath} />;
}
