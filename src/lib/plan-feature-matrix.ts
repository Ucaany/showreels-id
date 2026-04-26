export type PlanFeatureLocale = "id" | "en";
export type PlanFeaturePlanName = "free" | "creator" | "business";
export type PlanFeatureStatus = "available" | "unavailable" | "coming_soon";

type LocalizedText = Record<PlanFeatureLocale, string>;

type PlanFeatureValue = {
  text: LocalizedText;
  status: PlanFeatureStatus;
};

type PlanFeatureRow = {
  id: string;
  category: LocalizedText;
  values: Record<PlanFeaturePlanName, PlanFeatureValue>;
};

const PLAN_FEATURE_ROWS: PlanFeatureRow[] = [
  {
    id: "link-builder",
    category: { id: "Link Builder", en: "Link Builder" },
    values: {
      free: {
        text: { id: "Maksimal 10 link", en: "Up to 10 links" },
        status: "available",
      },
      creator: {
        text: { id: "Tanpa batas", en: "Unlimited" },
        status: "available",
      },
      business: {
        text: { id: "Tanpa batas", en: "Unlimited" },
        status: "available",
      },
    },
  },
  {
    id: "analytics",
    category: { id: "Analytics", en: "Analytics" },
    values: {
      free: {
        text: { id: "Maksimal 7 hari", en: "Up to 7 days" },
        status: "available",
      },
      creator: {
        text: { id: "Maksimal 30 hari", en: "Up to 30 days" },
        status: "available",
      },
      business: {
        text: { id: "Maksimal 30 hari", en: "Up to 30 days" },
        status: "available",
      },
    },
  },
  {
    id: "username-changes",
    category: { id: "Username Changes", en: "Username Changes" },
    values: {
      free: {
        text: { id: "2x / 30 hari", en: "2 changes / 30 days" },
        status: "available",
      },
      creator: {
        text: { id: "3x / 30 hari", en: "3 changes / 30 days" },
        status: "available",
      },
      business: {
        text: { id: "3x / 30 hari", en: "3 changes / 30 days" },
        status: "available",
      },
    },
  },
  {
    id: "custom-thumbnail",
    category: { id: "Custom Thumbnail", en: "Custom Thumbnail" },
    values: {
      free: {
        text: { id: "Tidak tersedia", en: "Not available" },
        status: "unavailable",
      },
      creator: {
        text: { id: "Tersedia", en: "Available" },
        status: "available",
      },
      business: {
        text: { id: "Tersedia", en: "Available" },
        status: "available",
      },
    },
  },
  {
    id: "video-quota-per-source",
    category: { id: "Quota Video per Source", en: "Video Quota per Source" },
    values: {
      free: {
        text: { id: "10 video / platform", en: "10 videos / platform" },
        status: "available",
      },
      creator: {
        text: { id: "50 video / platform", en: "50 videos / platform" },
        status: "available",
      },
      business: {
        text: { id: "Tanpa batas / platform", en: "Unlimited / platform" },
        status: "available",
      },
    },
  },
  {
    id: "creator-group",
    category: { id: "Creator Group", en: "Creator Group" },
    values: {
      free: {
        text: { id: "Tidak termasuk", en: "Not included" },
        status: "unavailable",
      },
      creator: {
        text: { id: "Termasuk", en: "Included" },
        status: "available",
      },
      business: {
        text: { id: "Termasuk", en: "Included" },
        status: "available",
      },
    },
  },
  {
    id: "contact-support",
    category: { id: "Contact Support", en: "Contact Support" },
    values: {
      free: {
        text: { id: "Support standar", en: "Standard support" },
        status: "available",
      },
      creator: {
        text: { id: "Support prioritas", en: "Priority support" },
        status: "available",
      },
      business: {
        text: { id: "Support prioritas", en: "Priority support" },
        status: "available",
      },
    },
  },
  {
    id: "whitelabel",
    category: { id: "Whitelabel", en: "Whitelabel" },
    values: {
      free: {
        text: { id: "Tidak tersedia", en: "Not available" },
        status: "unavailable",
      },
      creator: {
        text: { id: "Tidak tersedia", en: "Not available" },
        status: "unavailable",
      },
      business: {
        text: { id: "Tersedia", en: "Available" },
        status: "available",
      },
    },
  },
  {
    id: "theme-switch",
    category: { id: "Theme Switch", en: "Theme Switch" },
    values: {
      free: {
        text: { id: "Tidak tersedia", en: "Not available" },
        status: "unavailable",
      },
      creator: {
        text: { id: "Tidak tersedia", en: "Not available" },
        status: "unavailable",
      },
      business: {
        text: { id: "Coming soon", en: "Coming soon" },
        status: "coming_soon",
      },
    },
  },
];

export type PlanFeatureChecklistItem = {
  id: string;
  label: string;
  status: PlanFeatureStatus;
};

export function getPlanFeatureBullets(
  planName: PlanFeaturePlanName,
  locale: PlanFeatureLocale
): string[] {
  return PLAN_FEATURE_ROWS.map(
    (row) => `${row.category[locale]}: ${row.values[planName].text[locale]}`
  );
}

export function getPlanFeatureChecklist(
  planName: PlanFeaturePlanName,
  locale: PlanFeatureLocale
): PlanFeatureChecklistItem[] {
  return PLAN_FEATURE_ROWS.map((row) => {
    const value = row.values[planName];
    return {
      id: row.id,
      label: `${row.category[locale]}: ${value.text[locale]}`,
      status: value.status,
    };
  });
}

export function getPlanFeatureComingSoonLabel(locale: PlanFeatureLocale): string {
  return locale === "en" ? "Coming soon" : "Segera hadir";
}

export function isPlanFeatureUnavailable(status: PlanFeatureStatus) {
  return status === "unavailable";
}

export function isPlanFeatureChecked(status: PlanFeatureStatus) {
  return status === "available" || status === "coming_soon";
}

export function isPlanFeatureComingSoon(status: PlanFeatureStatus) {
  return status === "coming_soon";
}

export function getPlanFeatureStatusByKeyword(
  text: string,
  locale: PlanFeatureLocale
): PlanFeatureStatus {
  const normalized = text.trim().toLowerCase();
  const unavailableTerms =
    locale === "en"
      ? ["not available", "not included"]
      : ["tidak tersedia", "tidak termasuk"];
  const comingSoonTerms =
    locale === "en" ? ["coming soon"] : ["coming soon", "segera hadir"];

  if (comingSoonTerms.some((term) => normalized.includes(term))) {
    return "coming_soon";
  }

  if (unavailableTerms.some((term) => normalized.includes(term))) {
    return "unavailable";
  }

  return "available";
}

export function getPlanFeatureChecklistFromBullets(
  bullets: string[],
  locale: PlanFeatureLocale
): PlanFeatureChecklistItem[] {
  return bullets.map((label, index) => ({
    id: `fallback-${index}`,
    label,
    status: getPlanFeatureStatusByKeyword(label, locale),
  }));
}
