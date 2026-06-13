export default function AnalyticsLoading() {
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="max-w-2xl">
          <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-9 w-72 animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded-lg bg-slate-50" />
        </div>
      </section>

      {/* Filter Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="mt-1 h-4 w-40 animate-pulse rounded bg-slate-50" />
          </div>
          <div className="h-10 w-40 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div className="h-9 w-9 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-4 h-3 w-20 animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
            <div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-50" />
          </div>
        ))}
      </div>

      {/* Chart Area */}
      <div className="grid gap-5 xl:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6 xl:col-span-8">
          <div className="h-5 w-28 animate-pulse rounded bg-slate-100" />
          <div className="mt-1 h-7 w-56 animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-5 h-72 w-full animate-pulse rounded-2xl bg-slate-50" />
        </div>
        <aside className="space-y-5 xl:col-span-4">
          <div className="h-64 w-full animate-pulse rounded-3xl bg-slate-900/10" />
          <div className="h-48 w-full animate-pulse rounded-3xl border border-slate-200 bg-white" />
        </aside>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-56 w-full animate-pulse rounded-2xl border border-slate-200 bg-white" />
        <div className="h-56 w-full animate-pulse rounded-2xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}
