import { redirect } from "next/navigation";
import { getCreatorBioHref } from "@/lib/public-route-utils";

export default async function LegacyCreatorProfileRedirect({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  redirect(getCreatorBioHref(username));
}
