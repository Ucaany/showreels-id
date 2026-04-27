import Link from "next/link";
import { Copy, Link2, PlayCircle } from "lucide-react";
import { CopyProfileLinkButton } from "@/components/dashboard/copy-profile-link-button";
import { CreatorTrafficPanel } from "@/components/dashboard/creator-traffic-panel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireCurrentUser } from "@/server/current-user";

export default async function DashboardAnalyticsPage() {
  const user = await requireCurrentUser();

  return (
    <div className="dashboard-stack">
      <Card className="dashboard-panel p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e24f3b]">
              Analytics
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-[#201b18] sm:text-3xl">
              Trafik Halaman Creator
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#5d514b]">
              Pantau performa profile creator dan video publik kamu dalam satu panel analytics.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CopyProfileLinkButton username={user.username || "creator"} />
            <Link href={`/creator/${user.username || "creator"}`} target="_blank">
              <Button variant="secondary">
                <PlayCircle className="h-4 w-4" />
                Preview Halaman
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <CreatorTrafficPanel />

      <Card className="dashboard-panel p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-[#201b18]">Tips tingkatkan trafik</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-[#e3d9d3] bg-white p-3">
            <p className="text-sm font-semibold text-[#201b18]">Update Link Builder rutin</p>
            <p className="mt-1 text-sm text-[#5f524b]">
              Tampilkan link terpenting di urutan atas untuk meningkatkan klik.
            </p>
          </div>
          <div className="rounded-2xl border border-[#e3d9d3] bg-white p-3">
            <p className="text-sm font-semibold text-[#201b18]">Bagikan public link</p>
            <p className="mt-1 text-sm text-[#5f524b]">
              Gunakan CTA copy link lalu bagikan ke Instagram bio, WA, dan email portfolio.
            </p>
          </div>
          <div className="rounded-2xl border border-[#e3d9d3] bg-white p-3">
            <p className="text-sm font-semibold text-[#201b18]">Aktifkan video publik</p>
            <p className="mt-1 text-sm text-[#5f524b]">
              Semakin banyak karya publik yang relevan, semakin tinggi potensi kunjungan.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/dashboard/link-builder">
            <Button variant="secondary">
              <Link2 className="h-4 w-4" />
              Buka Link Builder
            </Button>
          </Link>
          <Link href="/dashboard/videos">
            <Button variant="secondary">
              <Copy className="h-4 w-4" />
              Kelola Video
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
