import Link from "next/link";
import { and, desc, eq, ne, notInArray } from "drizzle-orm";
import { BarChart3, Film, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { db } from "@/db";
import { users, videos } from "@/db/schema";
import { formatDateLabel } from "@/lib/helpers";
import { getAdminEmails, isAdminConfigured } from "@/server/admin-access";

export default async function AdminPanelPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const adminEmails = Array.from(getAdminEmails());
  const hasAdminEmails = adminEmails.length > 0;

  const creators = await db.query.users.findMany({
    where: hasAdminEmails
      ? and(notInArray(users.email, adminEmails), ne(users.role, "owner"))
      : ne(users.role, "owner"),
    orderBy: desc(users.createdAt),
    with: {
      videos: true,
    },
  });

  const latestVideosRaw = await db.query.videos.findMany({
    where: eq(videos.visibility, "public"),
    orderBy: desc(videos.createdAt),
    limit: 20,
    with: {
      author: true,
    },
  });
  const latestVideos = latestVideosRaw
    .filter(
      (video) =>
        video.author?.role !== "owner" &&
        !adminEmails.includes((video.author?.email || "").toLowerCase())
    )
    .slice(0, 8);

  const rawPage = Number.parseInt(resolvedSearchParams.page || "1", 10);
  const creatorsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(creators.length / creatorsPerPage));
  const currentPage = Number.isNaN(rawPage)
    ? 1
    : Math.min(Math.max(rawPage, 1), totalPages);
  const startIndex = (currentPage - 1) * creatorsPerPage;
  const visibleCreators = creators.slice(startIndex, startIndex + creatorsPerPage);

  const totalVideos = creators.reduce(
    (total, creator) => total + creator.videos.length,
    0
  );
  const totalDraft = creators.reduce(
    (total, creator) =>
      total + creator.videos.filter((video) => video.visibility === "draft").length,
    0
  );
  const totalPrivate = creators.reduce(
    (total, creator) =>
      total + creator.videos.filter((video) => video.visibility === "private").length,
    0
  );
  const totalPublic = creators.reduce(
    (total, creator) =>
      total + creator.videos.filter((video) => video.visibility === "public").length,
    0
  );

  const pageHref = (page: number) => `/admin?page=${page}`;

  return (
    <div className="space-y-6">
      <Card className="border-border bg-surface">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
          Owner Admin Panel
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-slate-950">
          Monitoring Website Owner
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Lihat data creator terdaftar, status video, dan aktivitas terbaru dari
          satu dashboard admin.
        </p>
        {!isAdminConfigured() ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            `ADMIN_EMAILS` belum diatur. Akses admin panel ditutup sampai email
            owner/admin dikonfigurasi.
          </div>
        ) : null}
      </Card>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-surface">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <Users className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm text-slate-600">Total Creator</p>
          <p className="mt-1 font-display text-3xl font-semibold text-slate-900">
            {creators.length}
          </p>
        </Card>
        <Card className="border-border bg-surface">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <Film className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm text-slate-600">Total Video</p>
          <p className="mt-1 font-display text-3xl font-semibold text-slate-900">
            {totalVideos}
          </p>
        </Card>
        <Card className="border-border bg-surface">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <BarChart3 className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm text-slate-600">Video Sukses (Publik)</p>
          <p className="mt-1 font-display text-3xl font-semibold text-slate-900">
            {totalPublic}
          </p>
          <p className="text-xs text-slate-500">
            Draft: {totalDraft} · Private: {totalPrivate}
          </p>
        </Card>
        <Card className="border-border bg-surface">
          <p className="text-sm text-slate-600">Rata-rata video/creator</p>
          <p className="mt-3 font-display text-3xl font-semibold text-slate-900">
            {creators.length ? (totalVideos / creators.length).toFixed(1) : "0.0"}
          </p>
          <p className="text-xs text-slate-500">Update realtime dari database</p>
        </Card>
      </section>

      <section>
        <Card className="border-border bg-surface">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-slate-900">
                Creator Terdaftar
              </h2>
              <p className="text-sm text-slate-600">
                Informasi akun creator, kota, kontak, dan status video.
              </p>
            </div>
            <Badge>
              Halaman {currentPage}/{totalPages}
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.15em] text-slate-500">
                  <th className="px-3 py-2">Creator</th>
                  <th className="px-3 py-2">Kontak</th>
                  <th className="px-3 py-2">Lokasi</th>
                  <th className="px-3 py-2">Video</th>
                  <th className="px-3 py-2">Bergabung</th>
                  <th className="px-3 py-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {visibleCreators.map((creator) => {
                  const creatorPublicCount = creator.videos.filter(
                    (video) => video.visibility === "public"
                  ).length;
                  const creatorDraftCount = creator.videos.filter(
                    (video) => video.visibility === "draft"
                  ).length;
                  const creatorPrivateCount = creator.videos.filter(
                    (video) => video.visibility === "private"
                  ).length;

                  return (
                    <tr key={creator.id} className="border-b border-slate-100 align-top">
                      <td className="px-3 py-3">
                        <p className="font-semibold text-slate-900">
                          {creator.name || "Creator"}
                        </p>
                        <p className="text-sm text-slate-600">@{creator.username || "-"}</p>
                        <p className="text-xs text-slate-500">{creator.email}</p>
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-700">
                        <p>{creator.contactEmail || "-"}</p>
                        <p>{creator.phoneNumber || "-"}</p>
                        <p className="break-all">{creator.websiteUrl || "-"}</p>
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-700">
                        {creator.city || "-"}
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-700">
                        <p>Total: {creator.videos.length}</p>
                        <p>Publik: {creatorPublicCount}</p>
                        <p>Draft: {creatorDraftCount}</p>
                        <p>Private: {creatorPrivateCount}</p>
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-700">
                        {formatDateLabel(creator.createdAt.toISOString())}
                      </td>
                      <td className="px-3 py-3">
                        {creator.username ? (
                          <Link href={`/creator/${creator.username}`}>
                            <Button size="sm" variant="secondary">
                              Lihat Profil
                            </Button>
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-500">Username belum diatur</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <Link href={pageHref(Math.max(1, currentPage - 1))}>
                <Button variant="secondary" size="sm" disabled={currentPage === 1}>
                  Sebelumnya
                </Button>
              </Link>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: totalPages }, (_, index) => {
                  const page = index + 1;
                  return (
                    <Link key={page} href={pageHref(page)}>
                      <Button
                        size="sm"
                        variant={page === currentPage ? "primary" : "secondary"}
                      >
                        {page}
                      </Button>
                    </Link>
                  );
                })}
              </div>
              <Link href={pageHref(Math.min(totalPages, currentPage + 1))}>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={currentPage === totalPages}
                >
                  Berikutnya
                </Button>
              </Link>
            </div>
          ) : null}
        </Card>
      </section>

      <section>
        <Card className="border-border bg-surface">
          <h2 className="font-display text-xl font-semibold text-slate-900">
            Video Terbaru Platform
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Snapshot cepat untuk memantau video yang baru diunggah creator.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {latestVideos.map((video) => (
              <div
                key={video.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{video.title}</p>
                  <Badge>{video.visibility}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Creator: {video.author?.name || "-"}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDateLabel(video.createdAt.toISOString())}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
