export type PlanFeatureLocale = "id" | "en";
export type PlanFeaturePlanName = "free" | "pro" | "business";

type LocalizedText = Record<PlanFeatureLocale, string>;

type PlanFeatureRow = {
  category: LocalizedText;
  values: Record<PlanFeaturePlanName, LocalizedText>;
};

const PLAN_FEATURE_ROWS: PlanFeatureRow[] = [
  {
    category: { id: "Link Builder", en: "Link Builder" },
    values: {
      free: { id: "Maksimal 10 link", en: "Up to 10 links" },
      pro: { id: "Tanpa batas", en: "Unlimited" },
      business: { id: "Tanpa batas", en: "Unlimited" },
    },
  },
  {
    category: { id: "Analytics", en: "Analytics" },
    values: {
      free: { id: "Maksimal 7 hari", en: "Up to 7 days" },
      pro: { id: "Maksimal 30 hari", en: "Up to 30 days" },
      business: { id: "Maksimal 30 hari", en: "Up to 30 days" },
    },
  },
  {
    category: { id: "Username Changes", en: "Username Changes" },
    values: {
      free: { id: "2x / 30 hari", en: "2 changes / 30 days" },
      pro: { id: "3x / 30 hari", en: "3 changes / 30 days" },
      business: { id: "3x / 30 hari", en: "3 changes / 30 days" },
    },
  },
  {
    category: { id: "Custom Thumbnail", en: "Custom Thumbnail" },
    values: {
      free: { id: "Tidak tersedia", en: "Not available" },
      pro: { id: "Tersedia", en: "Available" },
      business: { id: "Tersedia", en: "Available" },
    },
  },
  {
    category: { id: "Quota Video per Source", en: "Video Quota per Source" },
    values: {
      free: { id: "10 video / platform", en: "10 videos / platform" },
      pro: { id: "50 video / platform", en: "50 videos / platform" },
      business: { id: "Tanpa batas / platform", en: "Unlimited / platform" },
    },
  },
  {
    category: { id: "Creator Group", en: "Creator Group" },
    values: {
      free: { id: "Tidak termasuk", en: "Not included" },
      pro: { id: "Termasuk", en: "Included" },
      business: { id: "Termasuk", en: "Included" },
    },
  },
  {
    category: { id: "Contact Support", en: "Contact Support" },
    values: {
      free: { id: "Support standar", en: "Standard support" },
      pro: { id: "Support prioritas", en: "Priority support" },
      business: { id: "Support prioritas", en: "Priority support" },
    },
  },
  {
    category: { id: "Whitelabel", en: "Whitelabel" },
    values: {
      free: { id: "Tidak tersedia", en: "Not available" },
      pro: { id: "Tidak tersedia", en: "Not available" },
      business: { id: "Tersedia", en: "Available" },
    },
  },
  {
    category: { id: "Theme Switch", en: "Theme Switch" },
    values: {
      free: { id: "Tidak tersedia", en: "Not available" },
      pro: { id: "Tidak tersedia", en: "Not available" },
      business: { id: "Coming soon", en: "Coming soon" },
    },
  },
];

export function getPlanFeatureBullets(
  planName: PlanFeaturePlanName,
  locale: PlanFeatureLocale
): string[] {
  return PLAN_FEATURE_ROWS.map(
    (row) => `${row.category[locale]}: ${row.values[planName][locale]}`
  );
}
