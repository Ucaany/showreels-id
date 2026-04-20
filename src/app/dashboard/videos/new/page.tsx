import { VideoForm } from "@/components/dashboard/video-form";
import { requireCurrentUser } from "@/server/current-user";

export default async function DashboardNewVideoPage() {
  await requireCurrentUser();
  return <VideoForm />;
}
