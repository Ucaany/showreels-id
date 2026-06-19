import { VideoForm } from "@/components/dashboard/video-form";
import { requireCurrentUser } from "@/server/current-user";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";

export default async function DashboardNewVideoPage() {
  const user = await requireCurrentUser();
  const entitlementState = await getCreatorEntitlementsForUser(user.id);
  return (
    <VideoForm
      customThumbnailEnabled={entitlementState.entitlements.customThumbnailEnabled}
    />
  );
}
