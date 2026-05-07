export default function ProfileLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 animate-pulse rounded-lg bg-slate-100" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Cover & Avatar Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="aspect-[4/1] w-full animate-pulse bg-gradient-to-br from-slate-100 via-slate-50 to-white" />
          <div className="px-5 pb-4 pt-11 sm:px-6 sm:pt-12">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
          </div>
        </div>

        {/* Identity Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-20 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 h-3 w-20 animate-pulse rounded bg-slate-50" />
                <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
              </div>
              <div>
                <div className="mb-1 h-3 w-12 animate-pulse rounded bg-slate-50" />
                <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
              </div>
            </div>
            <div>
              <div className="mb-1 h-3 w-20 animate-pulse rounded bg-slate-50" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
            </div>
          </div>
        </div>

        {/* Bio & Experience Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-32 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="mb-1 h-3 w-8 animate-pulse rounded bg-slate-50" />
              <div className="h-24 w-full animate-pulse rounded-lg bg-slate-100" />
            </div>
            <div>
              <div className="mb-1 h-3 w-20 animate-pulse rounded bg-slate-50" />
              <div className="h-24 w-full animate-pulse rounded-lg bg-slate-100" />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-14 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-10 w-full animate-pulse rounded-lg bg-slate-100" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 pt-1 lg:col-span-2">
          <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
