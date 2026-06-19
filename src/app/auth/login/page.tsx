import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getSafeNextPath } from "@/lib/safe-next-path";
import { getCurrentUser } from "@/server/current-user";

const ALLOWED_CALLBACK_ORIGINS = new Set([
  "https://showreels.id",
  "https://www.showreels.id",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

function resolveCallbackPath(value?: string) {
  if (!value) return undefined;

  if (value.startsWith("/")) {
    return value;
  }

  try {
    const parsed = new URL(value);

    if (!ALLOWED_CALLBACK_ORIGINS.has(parsed.origin)) {
      return undefined;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return undefined;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; callbackUrl?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await getCurrentUser();
  const callbackPath = resolveCallbackPath(resolvedSearchParams.callbackUrl);
  const nextPath = getSafeNextPath(resolvedSearchParams.next ?? callbackPath);

  if (user?.id) {
    redirect(user.role === "owner" ? "/admin" : nextPath);
  }

  return (
    <LoginForm
      nextPath={nextPath}
      oauthError={
        typeof resolvedSearchParams.error === "string"
          ? resolvedSearchParams.error
          : ""
      }
    />
  );
}
