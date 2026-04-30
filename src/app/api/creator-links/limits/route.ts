import { NextResponse } from "next/server";
import { countActiveLinks } from "@/lib/link-builder";
import { getCurrentUser } from "@/server/current-user";
import { getEditableLinks } from "@/server/link-builder-storage";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entitlementState = await getCreatorEntitlementsForUser(currentUser.id);
  const links = getEditableLinks(currentUser);
  const activeLinks = countActiveLinks(links);
  const maxLinks = entitlementState.entitlements.linkBuilderMax;
  const canAddLink = typeof maxLinks !== "number" || activeLinks < maxLinks;
  const trialEndsAt = entitlementState.effectivePlan.trialEndsAt;
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86_400_000))
    : null;

  return NextResponse.json({
    plan: entitlementState.effectivePlan.planName,
    trial_status: entitlementState.effectivePlan.isTrialActive
      ? "active"
      : entitlementState.effectivePlan.isTrialExpired
        ? "expired"
        : "inactive",
    trial_days_left: trialDaysLeft,
    limits: {
      active_links: maxLinks,
      social_links: entitlementState.effectivePlan.planName === "free" ? 3 : null,
      custom_links: entitlementState.effectivePlan.planName === "free" ? 2 : null,
    },
    usage: {
      active_links: activeLinks,
      social_links: links.filter((link) => link.type === "social" && link.enabled !== false).length,
      custom_links: links.filter((link) => (link.type || "link") === "link" && link.enabled !== false).length,
    },
    can_add_link: canAddLink,
    reason: canAddLink ? null : "active_link_limit_reached",
  });
}
