import { LandingPage } from "@/components/landing-page";
import { getLandingStats } from "@/server/public-data";
import { getCurrentUser } from "@/server/current-user";
import { redirect } from "next/navigation";

type HomeSearchParams = {
  code?: string;
  next?: string;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams>;
}) {
  const params = await searchParams;

  if (params.code) {
    const callbackParams = new URLSearchParams({ code: params.code });

    if (params.next) {
      callbackParams.set("next", params.next);
    }

    redirect(`/auth/callback?${callbackParams.toString()}`);
  }

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
      currentUser={landingUser}
    />
  );
}
