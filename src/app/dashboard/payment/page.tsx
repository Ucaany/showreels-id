import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/server/current-user";
import {
  findValidPendingTransaction,
  getPlanCatalog,
  toBillingPaymentSummary,
} from "@/server/billing";
import { isBayarGGConfigured } from "@/server/bayar-gg";
import { getSiteSettings } from "@/server/site-settings";
import { PaymentCheckoutPanel } from "@/components/dashboard/payment-checkout-panel";
import type { BillingPlanName } from "@/server/billing";

type SearchParams = {
  plan?: string;
  intent?: string;
};

export default async function DashboardPaymentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireCurrentUser();
  const params = await searchParams;

  // Normalize plan name
  const normalizedPlan = params.plan === "pro" ? "creator" : params.plan;
  const selectedPlan: BillingPlanName | null =
    normalizedPlan === "creator" || normalizedPlan === "business"
      ? normalizedPlan
      : null;

  if (!selectedPlan) {
    redirect("/dashboard/billing");
  }

  // Fetch all required data
  const catalog = getPlanCatalog();
  const siteSettings = await getSiteSettings();
  const bayarGGConfigured = isBayarGGConfigured();

  // Check for existing valid pending transaction for this plan
  let existingPayment = null;
  try {
    const pendingTx = await findValidPendingTransaction(
      user.id,
      selectedPlan,
      "monthly"
    );
    if (pendingTx) {
      existingPayment = toBillingPaymentSummary(pendingTx);
    }
  } catch (error) {
    console.error("dashboard_payment_pending_check_error", error);
  }

  const planConfig = catalog[selectedPlan];
  const amount = planConfig.monthly;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <PaymentCheckoutPanel
        selectedPlan={selectedPlan}
        planLabel={planConfig.label}
        amount={amount}
        billingEnabled={siteSettings.billingEnabled}
        bayarGGConfigured={bayarGGConfigured}
        existingPayment={existingPayment}
        autoCheckout={params.intent === "checkout"}
      />
    </div>
  );
}
