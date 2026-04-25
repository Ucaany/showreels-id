import { BillingPanel } from "@/components/dashboard/billing-panel";
import {
  getMidtransRuntimeConfig,
  getBillingTransactions,
  getOrCreateSubscription,
  getPlanCatalog,
} from "@/server/billing";
import { requireCurrentUser } from "@/server/current-user";
import { getOrCreateCreatorSettings } from "@/server/creator-settings";
import {
  getCreatorEntitlementsForUser,
  getCreatorGroupLink,
  getSupportLink,
} from "@/server/subscription-policy";

export default async function DashboardBillingPage() {
  const user = await requireCurrentUser();
  const midtransRuntime = getMidtransRuntimeConfig();

  const [subscription, transactions, settings, entitlementState] = await Promise.all([
    getOrCreateSubscription(user.id),
    getBillingTransactions(user.id),
    getOrCreateCreatorSettings({
      userId: user.id,
      billingEmail: user.contactEmail || user.email,
    }),
    getCreatorEntitlementsForUser(user.id),
  ]);

  return (
    <BillingPanel
      initialPlan={{
        ...subscription,
        planName: subscription.planName as "free" | "pro" | "business",
        billingCycle: subscription.billingCycle as "monthly" | "yearly",
        status: subscription.status as "active" | "trial" | "expired" | "failed" | "pending",
        renewalDate: subscription.renewalDate?.toISOString() || null,
      }}
      effectivePlan={entitlementState.effectivePlan.planName}
      entitlements={entitlementState.entitlements}
      catalog={getPlanCatalog()}
      initialTransactions={transactions.map((transaction) => ({
        ...transaction,
        planName: transaction.planName as "free" | "pro" | "business",
        billingCycle: transaction.billingCycle as "monthly" | "yearly",
        status: transaction.status as "pending" | "paid" | "failed" | "cancelled" | "expired",
        createdAt: transaction.createdAt.toISOString(),
      }))}
      billingEmail={settings.billingEmail || user.contactEmail || user.email}
      paymentMethod={settings.paymentMethod}
      midtransConfig={{
        mode: midtransRuntime.mode,
        serverKeySet: midtransRuntime.serverKeySet,
        clientKeySet: midtransRuntime.clientKeySet,
      }}
      creatorGroupLink={getCreatorGroupLink()}
      supportLink={getSupportLink()}
    />
  );
}
