import { LandingPage } from "@/components/landing-page";
import { getLandingStats } from "@/server/public-data";

export default async function HomePage() {
  const stats = await getLandingStats();

  return (
    <LandingPage
      creatorCount={stats.creatorCount}
      videoCount={stats.videoCount}
      featuredCreators={stats.featuredCreators}
      featuredVideos={stats.featuredVideos}
    />
  );
}
