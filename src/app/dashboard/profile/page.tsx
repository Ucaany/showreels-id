import { ProfileForm } from "@/components/dashboard/profile-form";
import { requireCurrentUser } from "@/server/current-user";

export default async function DashboardProfilePage() {
  const user = await requireCurrentUser();
  return <ProfileForm user={user} />;
}
