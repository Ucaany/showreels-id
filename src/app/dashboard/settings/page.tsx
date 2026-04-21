import { SettingsPanel } from "@/components/dashboard/settings-panel";
import { requireCurrentUser } from "@/server/current-user";

export default async function DashboardSettingsPage() {
  const user = await requireCurrentUser();
  return <SettingsPanel username={user.username || "creator"} />;
}
