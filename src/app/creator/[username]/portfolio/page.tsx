import { redirect } from "next/navigation";
import { getCreatorPortfolioHref } from "@/lib/public-route-utils";

export default async function LegacyCreatorPortfolioRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ view?: string; page?: string }>;
}) {
  const { username } = await params;
  const { view } = await searchParams;
  const target = getCreatorPortfolioHref(username);
  redirect(view ? `${target}?view=${encodeURIComponent(view)}` : target);
}
