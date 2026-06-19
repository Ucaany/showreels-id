export default function PublicPortfolioLoading() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFCFE] text-[#111111]">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <section className="mb-10 animate-pulse rounded-[1.75rem] border border-[#E7E5E4]/60 bg-white/90 p-6 sm:rounded-[2rem] sm:p-8 lg:p-10">
          <div className="mx-auto h-20 w-20 rounded-full bg-[#ECECEC]" />
          <div className="mx-auto mt-5 h-7 w-56 rounded bg-[#ECECEC]" />
          <div className="mx-auto mt-3 h-4 w-40 rounded bg-[#F0F0F0]" />
          <div className="mx-auto mt-5 h-4 w-[70%] rounded bg-[#F0F0F0]" />
        </section>

        <div className="mb-5 animate-pulse rounded-2xl border border-[#E7E5E4]/50 bg-white/70 px-5 py-4">
          <div className="h-6 w-28 rounded bg-[#ECECEC]" />
          <div className="mt-2 h-4 w-20 rounded bg-[#F0F0F0]" />
        </div>

        <div className="grid gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <article
              key={`portfolio-loading-${index}`}
              className="animate-pulse overflow-hidden rounded-[1.5rem] border border-[#E7E5E4]/60 bg-white/90"
            >
              <div className="aspect-video bg-[#ECECEC]" />
              <div className="space-y-3 p-4 sm:p-5">
                <div className="h-4 w-24 rounded bg-[#F0F0F0]" />
                <div className="h-5 w-[85%] rounded bg-[#ECECEC]" />
                <div className="h-4 w-full rounded bg-[#F0F0F0]" />
                <div className="h-4 w-[75%] rounded bg-[#F0F0F0]" />
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
