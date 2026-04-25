import { SettingsHub } from "@/components/dashboard/settings-hub";
import { requireCurrentUser } from "@/server/current-user";

export default async function DashboardSettingsPage() {
  const user = await requireCurrentUser();
  return <SettingsHub username={user.username || "creator"} />;
}
