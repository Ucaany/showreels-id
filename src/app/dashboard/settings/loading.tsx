export default function SettingsLoading() {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
        <div className="mt-2 h-8 w-64 animate-pulse rounded-lg bg-slate-100" />
        <div className="mt-2 h-5 w-96 max-w-full animate-pulse rounded-lg bg-slate-50" />
        <div className="mt-4 h-12 w-full animate-pulse rounded-2xl bg-slate-50" />
      </div>

      {/* Settings Grid */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-4 w-4 animate-pulse rounded bg-slate-50" />
            </div>
            <div className="mt-3 h-5 w-32 animate-pulse rounded bg-slate-100" />
            <div className="mt-1 h-4 w-full animate-pulse rounded bg-slate-50" />
            <div className="mt-1 h-4 w-3/4 animate-pulse rounded bg-slate-50" />
          </div>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 sm:p-5">
        <div className="flex items-start gap-2.5">
          <div className="h-9 w-9 animate-pulse rounded-xl bg-rose-100" />
          <div>
            <div className="h-5 w-24 animate-pulse rounded bg-rose-100" />
            <div className="mt-1 h-4 w-64 animate-pulse rounded bg-rose-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
