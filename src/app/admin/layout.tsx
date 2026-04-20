import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isAdminEmail } from "@/server/admin-access";
import { requireCurrentUser } from "@/server/current-user";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCurrentUser();
  if (!isAdminEmail(user.email)) {
    redirect("/dashboard");
  }

  return (
    <DashboardShell user={user} mode="admin">
      {children}
    </DashboardShell>
  );
}
