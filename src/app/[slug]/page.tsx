import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { BioCreatorPublicPage, VideoDetailPublicPage } from "@/components/public/public-creator-pages";
import { createTextExcerpt, getCreatorBioHref, getVideoDetailHref, isReservedPublicSlug } from "@/lib/public-route-utils";
import { getAutoThumbnailFromVideoUrl, resolveThumbnailUrl } from "@/lib/video-utils";
import { getCurrentUser } from "@/server/current-user";
import { getPublicProfile, getPublicVideo } from "@/server/public-data";

/**
 * React.cache() deduplicate calls within the same request.
 * generateMetadata dan page render akan share hasil query yang sama,
 * mengurangi DB reads dari 2x menjadi 1x per request.
 */
const getCachedPublicProfile = cache(
  (slug: string, viewerUserId?: string | null) => getPublicProfile(slug, viewerUserId)
);

const getCachedPublicVideo = cache(
  (slug: string, viewerUserId?: string | null) => getPublicVideo(slug, viewerUserId)
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

  // Menggunakan cached version — akan di-reuse oleh page render
  const profile = await getCachedPublicProfile(slug);
  if (profile) {
    const title = `${profile.user.name || profile.user.username || "Creator"} — Showreels.id`;
    const description = createTextExcerpt(profile.user.bio, 155) || "Bio creator Showreels.id.";
    const image = profile.user.coverImageUrl || profile.user.image || undefined;
    const url = getCreatorBioHref(profile.user.username || slug);

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        type: "profile",
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

  const video = await getCachedPublicVideo(slug);
  if (!video || !video.author) {
    return {};
  }

  const image =
    resolveThumbnailUrl({
      customThumbnailUrl: video.thumbnailUrl,
      autoThumbnailUrl: video.previewImage,
      platformThumbnailUrl: getAutoThumbnailFromVideoUrl(video.sourceUrl),
    }) || undefined;
  const title = `${video.title} by ${video.author.name || "Creator"} — Showreels.id`;
  const description = createTextExcerpt(video.description, 155) || "Detail portfolio video Showreels.id.";
  const url = getVideoDetailHref(video.publicSlug);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "video.other",
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

export default async function PublicSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (isReservedPublicSlug(slug)) {
    notFound();
  }

  const currentUser = await getCurrentUser();

  // Menggunakan cached version — deduplicate dengan generateMetadata
  const profile = await getCachedPublicProfile(slug, currentUser?.id);
  if (profile) {
    return <BioCreatorPublicPage profile={profile} />;
  }

  const video = await getCachedPublicVideo(slug, currentUser?.id);
  if (video && video.author) {
    return <VideoDetailPublicPage video={video} />;
  }

  notFound();
}
