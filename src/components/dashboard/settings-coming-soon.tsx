import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function SettingsComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="dashboard-clean-card border-[#ddd3cd] bg-white/90 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e24f3b]">
        Settings
      </p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-[#201b18] sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5d514b]">{description}</p>
      <div className="mt-4">
        <Link href="/dashboard/settings">
          <Button variant="secondary">Kembali ke Settings</Button>
        </Link>
      </div>
    </Card>
  );
}
