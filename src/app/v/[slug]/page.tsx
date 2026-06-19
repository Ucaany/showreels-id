import { redirect } from "next/navigation";
import { getVideoDetailHref } from "@/lib/public-route-utils";

export default async function LegacyVideoDetailRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(getVideoDetailHref(slug));
}
