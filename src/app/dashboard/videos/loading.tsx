export default function VideosLoading() {
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-50" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-xl bg-slate-200" />
      </div>

      {/* Filter/Search Bar */}
      <div className="flex items-center gap-3">
        <div className="h-10 flex-1 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-100" />
      </div>

      {/* Video Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="aspect-video w-full animate-pulse bg-slate-100" />
            <div className="p-4">
              <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" />
              <div className="mt-2 flex items-center gap-2">
                <div className="h-4 w-16 animate-pulse rounded-full bg-slate-50" />
                <div className="h-4 w-20 animate-pulse rounded-full bg-slate-50" />
              </div>
              <div className="mt-3 h-3 w-24 animate-pulse rounded bg-slate-50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
