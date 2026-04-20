import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireCurrentUser } from "@/server/current-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCurrentUser();

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
