import { redirect } from "next/navigation";
import LandingPageNew from "@/components/landing-new";

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

  return <LandingPageNew />;
}
