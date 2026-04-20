import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/server/current-user";
import { isAdminEmail } from "@/server/admin-access";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCurrentUser();
  if (isAdminEmail(user.email)) {
    redirect("/admin");
  }

  return (
    <DashboardShell user={user}>
      {children}
    </DashboardShell>
  );
}
