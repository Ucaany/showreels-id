import { redirect } from "next/navigation";

type SearchParams = {
  plan?: string;
};

export default async function DashboardPaymentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const normalizedPlan = params.plan === "pro" ? "creator" : params.plan;
  const selectedPlan =
    normalizedPlan === "creator" || normalizedPlan === "business"
      ? normalizedPlan
      : null;

  if (!selectedPlan) {
    redirect("/dashboard/billing");
  }

  redirect(`/payment?plan=${selectedPlan}&intent=checkout`);
}
