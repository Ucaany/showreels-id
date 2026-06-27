"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { showFeedbackAlert } from "@/lib/feedback-alert";

type InboxNotification = {
  id: string;
  title: string;
  message: string;
  status: "unread" | "read";
  deliveredAt: string;
  readAt: string | null;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function NotificationInboxPanel({ compact = false }: { compact?: boolean }) {
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const loadNotifications = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (response.ok) {
      const payload = (await response.json()) as { notifications: InboxNotification[]; unreadCount: number };
      setNotifications(payload.notifications);
      setUnreadCount(payload.unreadCount);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadNotifications(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const markRead = async (notificationId?: string) => {
    startTransition(async () => {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationId ? { notificationId } : { markAll: true }),
      });

      if (!response.ok) {
        await showFeedbackAlert({ title: "Gagal memperbarui notifikasi", icon: "error" });
        return;
      }

      await loadNotifications();
    });
  };

  const visibleNotifications = compact ? notifications.slice(0, 4) : notifications;

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Bell className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Inbox Notifikasi</p>
            <h2 className="text-xl font-semibold">Pesan dari admin</h2>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void markRead()} disabled={!unreadCount || isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
          Tandai semua dibaca ({unreadCount})
        </Button>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Memuat notifikasi...</p>
        ) : visibleNotifications.length ? (
          visibleNotifications.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => item.status === "unread" && void markRead(item.id)}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition hover:bg-muted/50",
                item.status === "unread" ? "border-primary/30 bg-primary/5" : "border-border bg-background"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{item.title}</p>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", item.status === "unread" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{item.status === "unread" ? "Baru" : "Dibaca"}</span>
              </div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.message}</p>
              <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.deliveredAt)}</p>
            </button>
          ))
        ) : (
          <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">Belum ada notifikasi.</p>
        )}
      </div>
    </Card>
  );
}
