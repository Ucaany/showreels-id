import Link from "next/link";
import { BarChart3Icon, Link2Icon, UploadCloudIcon, ArrowUpRightIcon, TrendingUpIcon } from "lucide-react";
import { CreatorTrafficPanel } from "@/components/dashboard/creator-traffic-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pantau kunjungan profil, performa video, dan peluang optimasi secara real-time.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href="/dashboard/link-builder">
            <Button variant="outline" size="sm" className="gap-2">
              <Link2Icon className="h-4 w-4" />
              Build Link
            </Button>
          </Link>
          <Link href="/dashboard/videos">
            <Button variant="outline" size="sm" className="gap-2">
              <UploadCloudIcon className="h-4 w-4" />
              Upload Video
            </Button>
          </Link>
        </div>
      </div>

      <CreatorTrafficPanel />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUpIcon className="size-4 text-muted-foreground" />
            Tips tingkatkan trafik
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Tiga tindakan sederhana untuk membantu analytics kamu lebih cepat terisi data.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {tips.map((tip) => (
              <div key={tip.title} className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold">{tip.title}</h3>
                  <ArrowUpRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{tip.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
