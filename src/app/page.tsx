import dynamic from "next/dynamic";
import { getLandingStats } from "@/server/public-data";
import { getCurrentUser } from "@/server/current-user";
import { redirect } from "next/navigation";

/**
 * Dynamic import untuk landing page — mengurangi initial JS bundle.
 * Landing page (1935 baris + framer-motion) hanya dimuat client-side.
 */
const LandingPage = dynamic(
  () => import("@/components/landing-page").then((mod) => mod.LandingPage),
  {
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      </div>
    ),
  }
);

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

