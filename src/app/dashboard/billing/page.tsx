import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DashboardBillingPage() {
  return (
    <Card className="dashboard-clean-card border-[#ddd3cd] bg-white/90 p-5 sm:p-6">
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e24f3b]">
          Billing
        </p>
        <h1 className="font-display text-2xl font-semibold text-[#201b18] sm:text-3xl">
          Billing center sedang disiapkan
        </h1>
        <p className="text-sm leading-6 text-[#5d514b]">
          Active plan, riwayat transaksi, invoice, dan upgrade flow akan tersedia
          pada phase berikutnya.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link href="/dashboard">
            <Button>
              <CreditCard className="h-4 w-4" />
              Lihat Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/settings">
            <Button variant="secondary">Buka Settings</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
