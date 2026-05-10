import type { Metadata } from "next";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PortfolioCreatorPublicPage } from "@/components/public/public-creator-pages";
import { createTextExcerpt, getCreatorPortfolioHref, isReservedPublicSlug } from "@/lib/public-route-utils";
import { getCurrentUser } from "@/server/current-user";
import { getPublicProfile } from "@/server/public-data";

/**
 * React.cache() deduplicate calls within the same request.
 * generateMetadata dan page render akan share hasil query yang sama.
 */
const getCachedPublicProfile = cache(
  (slug: string, viewerUserId?: string | null, page?: number, pageSize?: number) =>
    getPublicProfile(slug, viewerUserId, { page, pageSize })
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  if (isReservedPublicSlug(slug)) {
    return {};
  }

  const ua = (await headers()).get("user-agent") ?? "";
  const isMobile = /Mobile|Android|iPhone|iPad|webOS/i.test(ua);
  const pageSize = isMobile ? 6 : 9;
  const profile = await getCachedPublicProfile(slug, undefined, 1, pageSize);
  if (!profile) {
    return {};
  }

  const displayName = profile.user.name || profile.user.username || "Creator";
  const title = `Portfolio ${displayName} — Showreels.id`;
  const description =
    createTextExcerpt(profile.user.bio, 145) || `Lihat portfolio video dari ${displayName}.`;
  const image = profile.user.coverImageUrl || profile.videos[0]?.thumbnailUrl || profile.user.image || undefined;
  const url = getCreatorPortfolioHref(profile.user.username || slug);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PublicPortfolioPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { view, page } = await searchParams;

  if (isReservedPublicSlug(slug)) {
    notFound();
  }

  const currentUser = await getCurrentUser();
  const pageNumber = Number.parseInt(page || "1", 10);
  const safePage = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const ua = (await headers()).get("user-agent") ?? "";
  const isMobile = /Mobile|Android|iPhone|iPad|webOS/i.test(ua);
  const pageSize = isMobile ? 6 : 9;
  const profile = await getCachedPublicProfile(slug, currentUser?.id, safePage, pageSize);

  if (!profile) {
    notFound();
  }

  return <PortfolioCreatorPublicPage profile={profile} view={view} />;
}
