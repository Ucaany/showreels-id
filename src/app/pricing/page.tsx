import { redirect } from "next/navigation";

type PricingSearchParams = {
  [key: string]: string | string[] | undefined;
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<PricingSearchParams>;
}) {
  const params = await searchParams;
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.length > 0) {
          nextParams.append(key, item);
        }
      }
      continue;
    }

    if (typeof value === "string" && value.length > 0) {
      nextParams.set(key, value);
    }
  }

  const nextQuery = nextParams.toString();
  redirect(nextQuery ? `/payment?${nextQuery}` : "/payment");
}
