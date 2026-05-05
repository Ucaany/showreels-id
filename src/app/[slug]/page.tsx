import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BioCreatorPublicPage, VideoDetailPublicPage } from "@/components/public/public-creator-pages";
import { createTextExcerpt, getCreatorBioHref, getVideoDetailHref, isReservedPublicSlug } from "@/lib/public-route-utils";
import { getAutoThumbnailFromVideoUrl } from "@/lib/video-utils";
import { getCurrentUser } from "@/server/current-user";
import { getPublicProfile, getPublicVideo } from "@/server/public-data";

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

  const video = await getPublicVideo(slug);
  if (!video || !video.author) {
    return {};
  }

  const image = video.thumbnailUrl || getAutoThumbnailFromVideoUrl(video.sourceUrl) || undefined;
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
  const profile = await getPublicProfile(slug, currentUser?.id);
  if (profile) {
    return <BioCreatorPublicPage profile={profile} />;
  }

  const video = await getPublicVideo(slug, currentUser?.id);
  if (video && video.author) {
    return <VideoDetailPublicPage video={video} />;
  }

  notFound();
}
