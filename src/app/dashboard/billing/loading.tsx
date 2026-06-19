export default function BillingLoading() {
  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Main Billing Card */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="p-5 sm:p-7">
            <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
            <div className="mt-4 h-10 w-80 max-w-full animate-pulse rounded-lg bg-slate-100" />
            <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded-lg bg-slate-50" />
            <div className="mt-5 flex gap-2">
              <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-200" />
              <div className="h-10 w-28 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-10 w-24 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </div>
          <div className="border-t border-zinc-200 p-5 sm:p-7 lg:border-l lg:border-t-0">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.35rem] border border-zinc-200 bg-white/90 p-4">
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                <div className="mt-2 h-9 w-32 animate-pulse rounded-lg bg-slate-100" />
                <div className="mt-1 h-3 w-20 animate-pulse rounded bg-slate-50" />
              </div>
              <div className="rounded-[1.35rem] border border-zinc-200 bg-white/90 p-4">
                <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
                <div className="mt-2 h-9 w-20 animate-pulse rounded-lg bg-slate-100" />
                <div className="mt-1 h-3 w-32 animate-pulse rounded bg-slate-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info & Transactions */}
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="h-6 w-24 animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
            <div className="mt-1 h-5 w-48 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
              <div className="mt-1 h-6 w-32 animate-pulse rounded-lg bg-slate-100" />
            </div>
            <div className="h-9 w-24 animate-pulse rounded-xl bg-slate-100" />
          </div>
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 w-full animate-pulse rounded-2xl bg-zinc-50" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
