import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { billingSubscriptions } from "@/db/schema";
import type { VideoSource } from "@/lib/types";
import type { BillingCycle, BillingPlanName } from "@/server/billing";
import { isRelationMissingError } from "@/server/database-errors";

export type CreatorPlanName = BillingPlanName;

export interface CreatorPlanEntitlements {
  planName: CreatorPlanName;
  linkBuilderMax: number | null;
  usernameChangesPer30Days: number;
  analyticsMaxDays: number;
  customThumbnailEnabled: boolean;
  whitelabelEnabled: boolean;
  sourceQuotaPerPlatform: Record<VideoSource, number | null>;
  creatorGroupEnabled: boolean;
  supportEnabled: boolean;
  themeSwitchComingSoon: boolean;
}

type EffectivePlanSource = "active_subscription" | "fallback_free";

export interface EffectiveCreatorPlan {
  planName: CreatorPlanName;
  billingCycle: BillingCycle;
  status: string;
  source: EffectivePlanSource;
}

const PLAN_LABELS: Record<CreatorPlanName, string> = {
  free: "Free",
  creator: "Creator",
  business: "Business",
};

const ENTITLEMENTS_BY_PLAN: Record<CreatorPlanName, CreatorPlanEntitlements> = {
  free: {
    planName: "free",
    linkBuilderMax: 10,
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
  creator: {
    planName: "creator",
    linkBuilderMax: null,
    usernameChangesPer30Days: 3,
    analyticsMaxDays: 30,
    customThumbnailEnabled: true,
    whitelabelEnabled: false,
    sourceQuotaPerPlatform: {
      youtube: 50,
      gdrive: 50,
      instagram: 50,
      facebook: 50,
      vimeo: 50,
    },
    creatorGroupEnabled: true,
    supportEnabled: true,
    themeSwitchComingSoon: false,
  },
  business: {
    planName: "business",
    linkBuilderMax: null,
    usernameChangesPer30Days: 3,
    analyticsMaxDays: 30,
    customThumbnailEnabled: true,
    whitelabelEnabled: true,
    sourceQuotaPerPlatform: {
      youtube: null,
      gdrive: null,
      instagram: null,
      facebook: null,
      vimeo: null,
    },
    creatorGroupEnabled: true,
    supportEnabled: true,
    themeSwitchComingSoon: true,
  },
};

const ENTITLED_SUBSCRIPTION_STATUSES = new Set(["active", "trial"]);

function normalizePlanName(value: string | null | undefined): CreatorPlanName {
  if (value === "pro" || value === "creator") {
    return "creator";
  }
  if (value === "business") {
    return value;
  }
  return "free";
}

function normalizeCycle(value: string | null | undefined): BillingCycle {
  return value === "yearly" ? "yearly" : "monthly";
}

function cloneEntitlements(source: CreatorPlanEntitlements): CreatorPlanEntitlements {
  return {
    ...source,
    sourceQuotaPerPlatform: {
      ...source.sourceQuotaPerPlatform,
    },
  };
}

export function getPlanLabel(planName: CreatorPlanName): string {
  return PLAN_LABELS[planName] || PLAN_LABELS.free;
}

export function getPlanEntitlements(planName: CreatorPlanName): CreatorPlanEntitlements {
  return cloneEntitlements(ENTITLEMENTS_BY_PLAN[planName] || ENTITLEMENTS_BY_PLAN.free);
}

export async function getEffectiveCreatorPlan(userId: string): Promise<EffectiveCreatorPlan> {
  if (!isDatabaseConfigured) {
    return {
      planName: "free",
      billingCycle: "monthly",
      status: "active",
      source: "fallback_free",
    };
  }

  let subscription:
    | {
        planName: string;
        billingCycle: string;
        status: string;
      }
    | null
    | undefined = null;

  try {
    subscription = await db.query.billingSubscriptions.findFirst({
      where: eq(billingSubscriptions.userId, userId),
      columns: {
        planName: true,
        billingCycle: true,
        status: true,
      },
    });
  } catch (error) {
    if (isRelationMissingError(error, "billing_subscriptions")) {
      return {
        planName: "free",
        billingCycle: "monthly",
        status: "missing",
        source: "fallback_free",
      };
    }
    throw error;
  }

  if (!subscription) {
    return {
      planName: "free",
      billingCycle: "monthly",
      status: "missing",
      source: "fallback_free",
    };
  }

  const normalizedStatus = subscription.status || "unknown";
  const normalizedPlan = normalizePlanName(subscription.planName);
  const normalizedCycle = normalizeCycle(subscription.billingCycle);

  if (!ENTITLED_SUBSCRIPTION_STATUSES.has(normalizedStatus)) {
    return {
      planName: "free",
      billingCycle: normalizedCycle,
      status: normalizedStatus,
      source: "fallback_free",
    };
  }

  return {
    planName: normalizedPlan,
    billingCycle: normalizedCycle,
    status: normalizedStatus,
    source: "active_subscription",
  };
}

export async function getCreatorEntitlementsForUser(userId: string) {
  const effectivePlan = await getEffectiveCreatorPlan(userId);
  return {
    effectivePlan,
    entitlements: getPlanEntitlements(effectivePlan.planName),
  };
}

export function getSourceQuotaForPlan(planName: CreatorPlanName, source: VideoSource) {
  const entitlements = ENTITLEMENTS_BY_PLAN[planName] || ENTITLEMENTS_BY_PLAN.free;
  return entitlements.sourceQuotaPerPlatform[source];
}

export function getCreatorGroupLink() {
  return (process.env.NEXT_PUBLIC_CREATOR_GROUP_URL || "").trim();
}

export function getSupportLink() {
  return (process.env.NEXT_PUBLIC_SUPPORT_URL || "").trim();
}
