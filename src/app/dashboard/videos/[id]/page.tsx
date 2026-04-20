import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { VideoForm } from "@/components/dashboard/video-form";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { requireCurrentUser } from "@/server/current-user";

export default async function EditVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireCurrentUser();
  const { id } = await params;

  const video = await db.query.videos.findFirst({
    where: and(eq(videos.id, id), eq(videos.userId, user.id)),
  });

  if (!video) {
    notFound();
  }

  return (
    <VideoForm
      mode="edit"
      initialVideo={{
        id: video.id,
        title: video.title,
        sourceUrl: video.sourceUrl,
        tags: video.tags,
        visibility: video.visibility,
        description: video.description,
        publicSlug: video.publicSlug,
      }}
    />
  );
}
