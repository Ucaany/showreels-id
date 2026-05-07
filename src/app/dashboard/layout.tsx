import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/server/current-user";
import { isAdminEmail } from "@/server/admin-access";
import { getEffectiveCreatorPlan } from "@/server/subscription-policy";
import { getOrCreateUserOnboarding } from "@/server/onboarding";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCurrentUser();
  if (isAdminEmail(user.email)) {
    redirect("/admin");
  }

  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") || "/dashboard";

  const [effectivePlan, onboarding] = await Promise.all([
    getEffectiveCreatorPlan(user.id),
    getOrCreateUserOnboarding({
      userId: user.id,
      customLinks: user.customLinks,
      createdAt: user.createdAt,
      profile: {
        fullName: user.name,
        username: user.username,
        role: user.role,
        bio: user.bio,
      },
    }),
  ]);

  // If user has no name/username AND onboarding not completed, redirect to onboarding page
  const shouldShowOnboarding =
    !onboarding.onboardingCompleted &&
    !onboarding.onboardingSkipped &&
    !user.name &&
    !user.username;

  if (shouldShowOnboarding) {
    redirect("/onboarding");
  }

  return (
    <DashboardShell
      user={user}
      planName={effectivePlan.planName}
    >
      {children}
    </DashboardShell>
  );
}
