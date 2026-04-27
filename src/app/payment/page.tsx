import { PricingSubscriptionPage } from "@/components/pricing/pricing-subscription-page";
import { getMidtransRuntimeConfig, getPlanCatalog } from "@/server/billing";
import { getCurrentUser } from "@/server/current-user";

type PaymentSearchParams = {
  plan?: string;
  intent?: string;
};

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<PaymentSearchParams>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const runtime = getMidtransRuntimeConfig();
  const catalog = getPlanCatalog();

  const normalizedPlan = params.plan === "pro" ? "creator" : params.plan;
  const initialPlan =
    normalizedPlan === "free" ||
    normalizedPlan === "creator" ||
    normalizedPlan === "business"
      ? normalizedPlan
      : "creator";

  return (
    <PricingSubscriptionPage
      initialPlan={initialPlan}
      autoCheckoutIntent={params.intent === "checkout"}
      isLoggedIn={Boolean(user?.id)}
      isOwner={user?.role === "owner"}
      account={{
        name: user?.name || null,
        email: user?.contactEmail || user?.email || null,
        username: user?.username || null,
      }}
      planPricing={{
        free: catalog.free.monthly,
        creator: catalog.creator.monthly,
        business: catalog.business.monthly,
      }}
      paymentConfig={{
        mode: runtime.mode,
        serverKeySet: runtime.serverKeySet,
      }}
    />
  );
}
