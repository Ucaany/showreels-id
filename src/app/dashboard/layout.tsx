import { DashboardShell } from "@/components/dashboard/dashboard-shell";
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
  const [effectivePlan, onboarding] = await Promise.all([
    getEffectiveCreatorPlan(user.id),
    getOrCreateUserOnboarding({
      userId: user.id,
      customLinks: user.customLinks,
      createdAt: user.createdAt,
    }),
  ]);

  if (!onboarding.onboardingCompleted) {
    redirect("/onboarding");
  }

  return (
    <DashboardShell user={user} planName={effectivePlan.planName}>
      {children}
    </DashboardShell>
  );
}
