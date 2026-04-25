import { SettingsHub } from "@/components/dashboard/settings-hub";
import { requireCurrentUser } from "@/server/current-user";
import {
  getCreatorEntitlementsForUser,
  getCreatorGroupLink,
  getSupportLink,
} from "@/server/subscription-policy";

export default async function DashboardSettingsPage() {
  const user = await requireCurrentUser();
  const entitlementState = await getCreatorEntitlementsForUser(user.id);
  return (
    <SettingsHub
      username={user.username || "creator"}
      planName={entitlementState.effectivePlan.planName}
      entitlements={entitlementState.entitlements}
      creatorGroupLink={getCreatorGroupLink()}
      supportLink={getSupportLink()}
    />
  );
}
