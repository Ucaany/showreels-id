import { NotificationInboxPanel } from "@/components/dashboard/notification-inbox-panel";
import { requireCurrentUser } from "@/server/current-user";

export default async function DashboardNotificationsPage() {
  await requireCurrentUser();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Inbox Notifikasi</h1>
        <p className="mt-2 text-sm text-slate-500">Lihat pesan, update, dan campaign yang dikirim oleh admin Showreels ID.</p>
      </div>
      <NotificationInboxPanel />
    </div>
  );
}
