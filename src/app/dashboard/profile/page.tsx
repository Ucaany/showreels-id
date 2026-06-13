import { Suspense } from "react";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { requireCurrentUser } from "@/server/current-user";

export default async function DashboardProfilePage() {
  const user = await requireCurrentUser();
  return (
    <Suspense fallback={null}>
      <ProfileForm user={user} />
    </Suspense>
  );
}
