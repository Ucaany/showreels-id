import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/server/current-user";
import { isAdminEmail } from "@/server/admin-access";
import { getEffectiveCreatorPlan } from "@/server/subscription-policy";
import { getOrCreateUserOnboarding } from "@/server/onboarding";
import type { EffectiveCreatorPlan } from "@/server/subscription-policy";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCurrentUser();
  if (isAdminEmail(user.email)) {
    redirect("/admin");
  }

  let effectivePlan: EffectiveCreatorPlan;
  let onboardingCompleted = false;
  let onboardingSkipped = false;

  try {
    const [plan, onboarding] = await Promise.all([
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
    effectivePlan = plan;
    onboardingCompleted = onboarding.onboardingCompleted;
    onboardingSkipped = onboarding.onboardingSkipped;
  } catch (error) {
    console.error("dashboard_layout_data_error", error);
    // Fallback: assume free plan and skip onboarding check
    effectivePlan = {
      planName: "free" as const,
      billingCycle: "monthly" as const,
      status: "active",
      source: "fallback_free" as const,
      trialStartedAt: null,
      trialEndsAt: null,
      isTrialActive: false,
      isTrialExpired: false,
    };
    onboardingCompleted = true;
    onboardingSkipped = false;
  }

  const shouldShowOnboarding = !onboardingCompleted && !onboardingSkipped;

  if (shouldShowOnboarding) {
    redirect("/onboarding");
  }

  return (
    <Suspense>
      <DashboardShell
        user={user}
        planName={effectivePlan.planName}
      >
        {children}
      </DashboardShell>
    </Suspense>
  );
}
