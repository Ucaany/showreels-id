import { redirect } from "next/navigation";
import { PaymentPagePanel } from "@/components/dashboard/payment-page-panel";
import { getPlanPrice, isMidtransConfigured } from "@/server/billing";

type SearchParams = {
  plan?: string;
};

export default async function DashboardPaymentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const selectedPlan =
    params.plan === "pro" || params.plan === "business" ? params.plan : null;

  if (!selectedPlan) {
    redirect("/dashboard/billing");
  }

  const planLabel = selectedPlan === "business" ? "Business" : "Pro";
  const amount = getPlanPrice(selectedPlan, "monthly");

  return (
    <PaymentPagePanel
      selectedPlan={selectedPlan}
      planLabel={planLabel}
      amount={amount}
      midtransReady={isMidtransConfigured()}
    />
  );
}
