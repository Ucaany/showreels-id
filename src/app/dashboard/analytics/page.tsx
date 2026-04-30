import Link from "next/link";
import { ArrowUpRight, Copy, Link2, PlayCircle } from "lucide-react";
import { CopyProfileLinkButton } from "@/components/dashboard/copy-profile-link-button";
import { CreatorTrafficPanel } from "@/components/dashboard/creator-traffic-panel";
import { Button } from "@/components/ui/button";
import { requireCurrentUser } from "@/server/current-user";

const tips = [
  {
    title: "Update Link Builder rutin",
    description: "Letakkan link prioritas di urutan atas agar pengunjung cepat mengambil tindakan.",
  },
  {
    title: "Bagikan public link",
    description: "Tambahkan link profil ke Instagram bio, WhatsApp, email, dan proposal portfolio.",
  },
  {
    title: "Aktifkan video publik",
    description: "Tampilkan karya terbaik untuk memperkuat discovery dan meningkatkan kunjungan.",
  },
];

export default async function DashboardAnalyticsPage() {
  const user = await requireCurrentUser();
  const username = user.username || "creator";

  return (
    <div className="space-y-5 bg-slate-50">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Analytics
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-4xl">
              Trafik Halaman Creator
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500 md:text-base">
              Pantau kunjungan profil, performa video publik, dan peluang optimasi dalam satu dashboard Bento yang ringkas.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 sm:flex-nowrap lg:justify-end">
            <CopyProfileLinkButton username={username} />
            <Link href={`/creator/${username}`} target="_blank" className="min-w-0 flex-1 sm:flex-none">
              <Button variant="secondary" className="w-full">
                <PlayCircle className="h-4 w-4" />
                Preview Halaman
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <CreatorTrafficPanel />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Next Steps
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Tips tingkatkan trafik</h2>
            <p className="mt-1 text-sm text-slate-500">
              Tiga tindakan sederhana untuk membantu analytics kamu lebih cepat terisi data.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/link-builder">
              <Button variant="secondary" size="sm">
                <Link2 className="h-4 w-4" />
                Buka Build Link
              </Button>
            </Link>
            <Link href="/dashboard/videos">
              <Button variant="secondary" size="sm">
                <Copy className="h-4 w-4" />
                Upload Video
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {tips.map((tip) => (
            <article key={tip.title} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900">{tip.title}</h3>
                <ArrowUpRight className="mt-0.5 h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-500">{tip.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
