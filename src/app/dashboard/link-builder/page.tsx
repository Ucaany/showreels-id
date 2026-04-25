import { LinkBuilderEditor } from "@/components/builder/link-builder-editor";
import { requireCurrentUser } from "@/server/current-user";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";

export default async function LinkBuilderPage() {
  const user = await requireCurrentUser();
  const entitlementState = await getCreatorEntitlementsForUser(user.id);
  return (
    <LinkBuilderEditor
      user={user}
      linkBuilderMax={entitlementState.entitlements.linkBuilderMax}
      planName={entitlementState.effectivePlan.planName}
    />
  );
}
