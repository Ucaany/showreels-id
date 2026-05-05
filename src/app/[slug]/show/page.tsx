import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioCreatorPublicPage } from "@/components/public/public-creator-pages";
import { createTextExcerpt, getCreatorPortfolioHref, isReservedPublicSlug } from "@/lib/public-route-utils";
import { getCurrentUser } from "@/server/current-user";
import { getPublicProfile } from "@/server/public-data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  if (isReservedPublicSlug(slug)) {
    return {};
  }

  const profile = await getPublicProfile(slug);
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
  searchParams: Promise<{ view?: string }>;
}) {
  const { slug } = await params;
  const { view } = await searchParams;

  if (isReservedPublicSlug(slug)) {
    notFound();
  }

  const currentUser = await getCurrentUser();
  const profile = await getPublicProfile(slug, currentUser?.id);

  if (!profile) {
    notFound();
  }

  return <PortfolioCreatorPublicPage profile={profile} view={view} />;
}
