export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {/* Hero Card Skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6 lg:col-span-2">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <div className="h-6 w-36 animate-pulse rounded-full bg-slate-100" />
              <div className="mt-5 h-8 w-72 animate-pulse rounded-lg bg-slate-100" />
              <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded-lg bg-slate-50" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-50" />
            </div>
          </div>
        </div>

        {/* Public Link Card Skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-10 w-full animate-pulse rounded-xl bg-slate-50" />
          <div className="mt-3 h-8 w-full animate-pulse rounded-lg bg-slate-50" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-4 gap-2 md:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-2.5 md:rounded-2xl md:p-5">
                <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
                <div className="mt-3 h-7 w-12 animate-pulse rounded-lg bg-slate-100 md:mt-5" />
              </div>
            ))}
          </div>
        </div>

        {/* Chart Skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6 lg:col-span-2">
          <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-6 w-48 animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-6 h-64 w-full animate-pulse rounded-2xl bg-slate-50" />
        </div>

        {/* Quick Actions Skeleton */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6 lg:col-span-1">
          <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-6 w-40 animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 w-full animate-pulse rounded-2xl bg-slate-50" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
