import { PublicVideosShowcase } from "@/components/public-videos-showcase";
import { getPublicShowcaseVideos } from "@/server/public-data";

export default async function VideosPage() {
  const videos = await getPublicShowcaseVideos(40);

  return (
    <PublicVideosShowcase
      videos={videos.map((video) => ({
        ...video,
        createdAt: video.createdAt.toISOString(),
      }))}
    />
  );
}
