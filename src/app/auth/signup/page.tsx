import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { getSafeNextPath } from "@/lib/safe-next-path";
import { sanitizeUsername } from "@/lib/username-rules";
import { getCurrentUser } from "@/server/current-user";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ username?: string; next?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const prefilledUsername = sanitizeUsername(params.username || "");
  const nextPath = getSafeNextPath(params.next);

  if (user?.id) {
    redirect(user.role === "owner" ? "/admin" : nextPath);
  }

  return <SignupForm initialUsername={prefilledUsername} nextPath={nextPath} />;
}
