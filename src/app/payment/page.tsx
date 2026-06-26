import { PricingSubscriptionPage } from "@/components/pricing/pricing-subscription-page";
import { Header } from "@/components/header";
import { getPlanCatalog } from "@/server/billing";
import { isBayarGGConfigured } from "@/server/bayar-gg";
import { getCurrentUser } from "@/server/current-user";
import { getSiteSettings } from "@/server/site-settings";

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
  const catalog = getPlanCatalog();
  const siteSettings = await getSiteSettings();
  const bayarGGConfigured = isBayarGGConfigured();

  const normalizedPlan = params.plan === "pro" ? "creator" : params.plan;
  const initialPlan =
    normalizedPlan === "free" ||
    normalizedPlan === "creator" ||
    normalizedPlan === "business"
      ? normalizedPlan
      : "creator";

  return (
    <>
      <Header />
      <div className="pt-[4.55rem]">
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
            configured: bayarGGConfigured,
            billingEnabled: siteSettings.billingEnabled,
          }}
        />
      </div>
    </>
  );
}
