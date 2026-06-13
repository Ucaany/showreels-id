import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { VideoForm } from "@/components/dashboard/video-form";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { requireCurrentUser } from "@/server/current-user";
import { getCreatorEntitlementsForUser } from "@/server/subscription-policy";

export default async function EditVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCurrentUser();
  const entitlementState = await getCreatorEntitlementsForUser(user.id);
  const { id } = await params;

  const video = await db.query.videos.findFirst({
    where: and(eq(videos.id, id), eq(videos.userId, user.id)),
    columns: {
      id: true,
      title: true,
      sourceUrl: true,
      aspectRatio: true,
      outputType: true,
      durationLabel: true,
      thumbnailUrl: true,
      extraVideoUrls: true,
      imageUrls: true,
      tags: true,
      visibility: true,
      description: true,
      publicSlug: true,
    },
  });

  if (!video) {
    notFound();
  }

  return (
    <VideoForm
      mode="edit"
      customThumbnailEnabled={entitlementState.entitlements.customThumbnailEnabled}
      initialVideo={{
        id: video.id,
        title: video.title,
        sourceUrl: video.sourceUrl,
        aspectRatio: video.aspectRatio,
        outputType: video.outputType,
        durationLabel: video.durationLabel,
        thumbnailUrl: video.thumbnailUrl,
        extraVideoUrls: video.extraVideoUrls,
        imageUrls: video.imageUrls,
        tags: video.tags,
        visibility: video.visibility,
        description: video.description,
        publicSlug: video.publicSlug,
      }}
    />
  );
}
