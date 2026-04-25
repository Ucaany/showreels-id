import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DashboardAnalyticsPage() {
  return (
    <Card className="dashboard-clean-card border-[#ddd3cd] bg-white/90 p-5 sm:p-6">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e24f3b]">
          Analytics
        </p>
        <h1 className="font-display text-2xl font-semibold text-[#201b18] sm:text-3xl">
          Analytics advanced segera hadir
        </h1>
        <p className="text-sm leading-6 text-[#5d514b]">
          Views over time, top-performing links, device breakdown, dan filter tanggal
          sedang dipersiapkan untuk phase berikutnya.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link href="/dashboard/link-builder">
            <Button>
              <BarChart3 className="h-4 w-4" />
              Kelola Link Builder
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary">Kembali ke Dashboard</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
