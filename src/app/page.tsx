import { LandingPage } from "@/components/landing-page";
import { getLandingStats } from "@/server/public-data";
import { getCurrentUser } from "@/server/current-user";

export default async function HomePage() {
  const stats = await getLandingStats();
  const currentUser = await getCurrentUser();
  const landingUser = currentUser
    ? {
        name: currentUser.name,
        username: currentUser.username,
        image: currentUser.image,
        email: currentUser.email,
      }
    : null;

  return (
    <LandingPage
      creatorCount={stats.creatorCount}
      videoCount={stats.videoCount}
      featuredCreators={stats.featuredCreators}
      featuredVideos={stats.featuredVideos}
      currentUser={landingUser}
    />
  );
}
