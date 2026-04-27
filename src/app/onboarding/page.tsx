import { redirect } from "next/navigation";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { isAdminEmail } from "@/server/admin-access";
import { requireCurrentUser } from "@/server/current-user";
import { getOrCreateUserOnboarding } from "@/server/onboarding";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";

export default async function OnboardingPage() {
  const user = await requireCurrentUser({ nextPath: "/onboarding" });
  if (isAdminEmail(user.email)) {
    redirect("/admin");
  }

  const [onboarding, entitlementState] = await Promise.all([
    getOrCreateUserOnboarding({
      userId: user.id,
      customLinks: user.customLinks,
      createdAt: user.createdAt,
    }),
    getCreatorEntitlementsForUser(user.id),
  ]);

  if (onboarding.onboardingCompleted) {
    redirect("/dashboard");
  }

  return (
    <OnboardingStepper
      initialStatus={onboarding}
      initialUser={{
        fullName: user.name || "",
        username: user.username || "",
        role: user.role || "",
        bio: user.bio || "",
        image: user.image || "",
        coverImageUrl: user.coverImageUrl || "",
      }}
      linkBuilderMax={entitlementState.entitlements.linkBuilderMax}
      planName={entitlementState.effectivePlan.planName}
    />
  );
}
