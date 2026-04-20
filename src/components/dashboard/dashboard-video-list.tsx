"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, PencilLine, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSourceLabel, getVisibilityLabel } from "@/lib/video-utils";
import { formatDateLabel } from "@/lib/helpers";
import type { VideoVisibility } from "@/lib/types";

interface DashboardVideoListProps {
  videos: Array<{
    id: string;
    title: string;
    source: string;
    visibility: VideoVisibility;
    publicSlug: string;
    createdAt: string;
  }>;
}

export function DashboardVideoList({ videos }: DashboardVideoListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Yakin ingin menghapus video ini? Tindakan ini tidak bisa dibatalkan."
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);

    const response = await fetch(`/api/videos/${id}`, {
      method: "DELETE",
    });

    setDeletingId(null);

    if (!response.ok) {
      window.alert("Gagal menghapus video. Coba lagi.");
      return;
    }

    router.refresh();
  };

  return (
    <div className="space-y-3">
      {videos.map((video) => (
        <div
          key={video.id}
          className="rounded-xl border border-border bg-white/80 p-4 transition hover:border-brand-200 hover:shadow-soft"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-900">{video.title}</h3>
                <Badge>{getSourceLabel(video.source as never)}</Badge>
                <Badge
                  className={
                    video.visibility === "public"
                      ? "bg-emerald-600"
                      : video.visibility === "private"
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-700"
                  }
                >
                  {getVisibilityLabel(video.visibility)}
                </Badge>
              </div>
              <p className="text-sm text-slate-600">
                {formatDateLabel(video.createdAt)}
              </p>
            </div>
            {video.visibility === "public" ? (
              <Link
                href={`/v/${video.publicSlug}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Lihat Public Page
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="text-sm font-medium text-slate-600">
                {video.visibility === "draft"
                  ? "Masih draft"
                  : "Tersimpan private"}
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/dashboard/videos/${video.id}`}>
              <Button variant="secondary" size="sm">
                <PencilLine className="h-4 w-4" />
                Edit
              </Button>
            </Link>
            <Button
              variant="danger"
              size="sm"
              disabled={deletingId === video.id}
              onClick={() => handleDelete(video.id)}
            >
              <Trash2 className="h-4 w-4" />
              {deletingId === video.id ? "Menghapus..." : "Hapus"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
