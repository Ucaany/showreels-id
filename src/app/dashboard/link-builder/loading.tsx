export default function LinkBuilderLoading() {
  return (
    <div className="animate-in fade-in duration-150">
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* Editor Panel */}
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="h-7 w-32 animate-pulse rounded-lg bg-slate-100" />
              <div className="mt-1 h-4 w-56 animate-pulse rounded bg-slate-50" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-9 w-20 animate-pulse rounded-xl bg-slate-200" />
            </div>
          </div>

          {/* Link Items */}
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 animate-pulse rounded bg-slate-100" />
                  <div className="flex-1">
                    <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
                    <div className="mt-1 h-3 w-56 animate-pulse rounded bg-slate-50" />
                  </div>
                  <div className="h-8 w-12 animate-pulse rounded-lg bg-slate-100" />
                </div>
              </div>
            ))}
          </div>

          {/* Add Button */}
          <div className="h-12 w-full animate-pulse rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50" />
        </div>

        {/* Preview Panel */}
        <div className="hidden lg:block">
          <div className="sticky top-20">
            <div className="h-[600px] w-full animate-pulse rounded-3xl border border-slate-200 bg-slate-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
