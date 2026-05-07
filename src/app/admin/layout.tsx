import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isAdminEmail } from "@/server/admin-access";
import { requireCurrentUser } from "@/server/current-user";
import { DEMO_MODE, isDemoAdmin } from "@/lib/demo-mode";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCurrentUser();

  const hasAdminAccess = DEMO_MODE
    ? isDemoAdmin(user.email)
    : isAdminEmail(user.email);

  if (!hasAdminAccess) {
    redirect("/dashboard");
  }

  return (
    <DashboardShell user={user} mode="admin">
      {children}
    </DashboardShell>
  );
}
