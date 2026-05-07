import { BillingPanel } from "@/components/dashboard/billing-panel";
import {
  getBillingTransactions,
  getOrCreateSubscription,
  getPlanCatalog,
  refreshBillingTransactionStatusFromMidtrans,
} from "@/server/billing";
import { isTripayConfigured } from "@/server/tripay";
import { requireCurrentUser } from "@/server/current-user";
import { getOrCreateCreatorSettings } from "@/server/creator-settings";
import {
  getCreatorEntitlementsForUser,
  getCreatorGroupLink,
  getSupportLink,
} from "@/server/subscription-policy";
import { getSiteSettings } from "@/server/site-settings";

type DashboardBillingPageProps = {
  searchParams?: Promise<{
    invoice?: string;
    payment?: string;
    plan?: string;
  }>;
};

export default async function DashboardBillingPage({
  searchParams,
}: DashboardBillingPageProps) {
  const user = await requireCurrentUser();
  const tripayConfigured = isTripayConfigured();
  const params = searchParams ? await searchParams : {};
  const invoiceId = typeof params.invoice === "string" ? params.invoice.trim() : "";

  if (invoiceId) {
    try {
      await refreshBillingTransactionStatusFromMidtrans({
        userId: user.id,
        invoiceId,
      });
    } catch (error) {
      console.error("Failed to refresh payment status", error);
    }
  }

  // Wrap all DB calls in try-catch to prevent page crash
  let subscription: Awaited<ReturnType<typeof getOrCreateSubscription>>;
  let transactions: Awaited<ReturnType<typeof getBillingTransactions>>;
  let settings: Awaited<ReturnType<typeof getOrCreateCreatorSettings>>;
  let entitlementState: Awaited<ReturnType<typeof getCreatorEntitlementsForUser>>;
  let siteSettings: Awaited<ReturnType<typeof getSiteSettings>>;

  try {
    [subscription, transactions, settings, entitlementState, siteSettings] = await Promise.all([
      getOrCreateSubscription(user.id),
      getBillingTransactions(user.id),
      getOrCreateCreatorSettings({
        userId: user.id,
        billingEmail: user.contactEmail || user.email,
      }),
      getCreatorEntitlementsForUser(user.id),
      getSiteSettings(),
    ]);
  } catch (error) {
    console.error("billing_page_data_error", error);
    // Fallback values so page doesn't crash
    subscription = {
      id: `fallback-${user.id}`,
      userId: user.id,
      planName: "free" as const,
      billingCycle: "monthly" as const,
      status: "active" as const,
      price: 0,
      currency: "IDR",
      renewalDate: null,
      nextPlanName: "free" as const,
      updatedAt: new Date(),
      createdAt: new Date(),
    };
    transactions = [];
    settings = {
      userId: user.id,
      publicProfile: true,
      searchIndexing: true,
      showPublicEmail: false,
      showSocialLinks: true,
      showPublicStats: false,
      whitelabelEnabled: false,
      billingEmail: user.contactEmail || user.email,
      paymentMethod: "tripay",
      taxInfo: "",
      invoiceNotes: "",
      updatedAt: new Date(),
      createdAt: new Date(),
    };
    entitlementState = {
      effectivePlan: {
        planName: "free" as const,
        billingCycle: "monthly" as const,
        status: "active",
        source: "fallback_free" as const,
        trialStartedAt: null,
        trialEndsAt: null,
        isTrialActive: false,
        isTrialExpired: false,
      },
      entitlements: {
        planName: "free" as const,
        linkBuilderMax: 5,
        usernameChangesPer30Days: 2,
        analyticsMaxDays: 7,
        customThumbnailEnabled: false,
        whitelabelEnabled: false,
        sourceQuotaPerPlatform: {
          youtube: 10,
          gdrive: 10,
          instagram: 10,
          facebook: 10,
          vimeo: 10,
        },
        creatorGroupEnabled: false,
        supportEnabled: false,
        themeSwitchComingSoon: false,
      },
    };
    siteSettings = {
      maintenanceEnabled: false,
      pauseEnabled: false,
      maintenanceMessage: "",
      billingEnabled: true,
    } as Awaited<ReturnType<typeof getSiteSettings>>;
  }

  return (
    <BillingPanel
      initialPlan={{
        ...subscription,
        planName: subscription.planName as "free" | "creator" | "business",
        billingCycle: subscription.billingCycle as "monthly" | "yearly",
        status: subscription.status as "active" | "trial" | "expired" | "failed" | "pending",
        renewalDate: subscription.renewalDate?.toISOString() || null,
      }}
      effectivePlan={entitlementState.effectivePlan.planName}
      entitlements={entitlementState.entitlements}
      catalog={getPlanCatalog()}
      initialTransactions={transactions.map((transaction) => ({
        ...transaction,
        planName: transaction.planName as "free" | "creator" | "business",
        billingCycle: transaction.billingCycle as "monthly" | "yearly",
        status: transaction.status as "pending" | "paid" | "failed" | "cancelled" | "expired",
        createdAt: transaction.createdAt.toISOString(),
      }))}
      billingEmail={settings.billingEmail || user.contactEmail || user.email}
      paymentMethod={settings.paymentMethod}
      midtransConfig={{
        mode: tripayConfigured ? "production" : "sandbox",
        serverKeySet: tripayConfigured,
        clientKeySet: tripayConfigured,
      }}
      creatorGroupLink={getCreatorGroupLink()}
      supportLink={getSupportLink()}
      billingEnabled={siteSettings.billingEnabled}
    />
  );
}
