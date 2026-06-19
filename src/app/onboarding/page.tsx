import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { normalizeStoredLinks } from "@/lib/link-builder";
import { isAdminEmail } from "@/server/admin-access";
import { getCurrentUser } from "@/server/current-user";
import { getOrCreateUserOnboarding } from "@/server/onboarding";

function readPayloadObject(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readStringRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, string | undefined>) : {};
}

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }
  if (isAdminEmail(user.email)) {
    redirect("/admin");
  }

  const onboarding = await getOrCreateUserOnboarding({
    userId: user.id,
    customLinks: user.customLinks,
    createdAt: user.createdAt,
    profile: {
      fullName: user.name,
      username: user.username,
      role: user.role,
      bio: user.bio,
    },
  });

  if (onboarding.onboardingCompleted) {
    redirect("/dashboard");
  }

  const progressPayload = readPayloadObject(onboarding.progressPayload);
  const payloadProfile = readStringRecord(progressPayload.profile);
  const payloadSocialLinks = readStringRecord(progressPayload.socialLinks);
  const tiktokLink = normalizeStoredLinks(user.customLinks).find(
    (link) =>
      link.platform === "tiktok" ||
      link.metadata?.onboardingSocialPlatform === "tiktok" ||
      link.metadata?.source === "onboarding_social_tiktok"
  );

  return (
    <OnboardingWizard
      initialData={{
        name: payloadProfile.fullName || user.name || "",
        email: user.email,
        username: payloadProfile.username || user.username || "",
        bio: payloadProfile.bio || user.bio || "",
        socialLinks: {
          instagram: payloadSocialLinks.instagram || user.instagramUrl || "",
          tiktok: payloadSocialLinks.tiktok || tiktokLink?.url || "",
          youtube: payloadSocialLinks.youtube || user.youtubeUrl || "",
          website: payloadSocialLinks.website || user.websiteUrl || "",
        },
        currentStep: onboarding.currentStep,
        hasPortfolio: onboarding.firstVideoUploaded,
        publicProfilePath: `/creator/${payloadProfile.username || user.username || "creator"}`,
      }}
    />
  );
}
