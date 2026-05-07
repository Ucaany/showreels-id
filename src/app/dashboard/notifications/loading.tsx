export default function NotificationsLoading() {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-28 animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-1 h-4 w-48 animate-pulse rounded bg-slate-50" />
        </div>
        <div className="h-9 w-32 animate-pulse rounded-xl bg-slate-100" />
      </div>

      {/* Notification Items */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-slate-100" />
              <div className="min-w-0 flex-1">
                <div className="h-5 w-48 animate-pulse rounded bg-slate-100" />
                <div className="mt-1 h-4 w-full animate-pulse rounded bg-slate-50" />
                <div className="mt-2 h-3 w-24 animate-pulse rounded bg-slate-50" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
