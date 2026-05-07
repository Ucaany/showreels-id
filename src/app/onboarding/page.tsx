import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getCurrentUser } from "@/server/current-user";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  // If user already completed onboarding (has username), redirect to dashboard
  if (user.username && user.name) {
    redirect("/dashboard");
  }

  return (
    <OnboardingWizard
      initialData={{
        name: user.name || "",
        email: user.email,
        username: user.username || "",
      }}
    />
  );
}
