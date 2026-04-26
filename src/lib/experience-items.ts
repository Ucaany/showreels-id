export const EXPERIENCE_STORAGE_PREFIX = "__EXP_V1__:";

export type ExperienceItem = {
  id: string;
  title: string;
  organization: string;
  period: string;
  description: string;
  skills: string;
};

function safeTrim(value: string | null | undefined) {
  return (value || "").trim();
}

function createFallbackId(seed: string, index: number) {
  const base = safeTrim(seed).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${base || "experience"}-${index + 1}`;
}

function normalizeExperienceItem(
  input: Partial<ExperienceItem>,
  index: number
): ExperienceItem {
  return {
    id: safeTrim(input.id) || createFallbackId(input.title || "", index),
    title: safeTrim(input.title).slice(0, 70),
    organization: safeTrim(input.organization).slice(0, 70),
    period: safeTrim(input.period).slice(0, 40),
    description: safeTrim(input.description).slice(0, 220),
    skills: safeTrim(input.skills).slice(0, 120),
  };
}

export function parseExperiencePayload(rawValue: string): ExperienceItem[] {
  const trimmed = safeTrim(rawValue);
  if (!trimmed) {
    return [];
  }

  if (trimmed.startsWith(EXPERIENCE_STORAGE_PREFIX)) {
    const rawJson = trimmed.slice(EXPERIENCE_STORAGE_PREFIX.length);
    try {
      const parsed = JSON.parse(rawJson) as Partial<ExperienceItem>[];
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed.map((item, index) => normalizeExperienceItem(item, index));
    } catch {
      return [];
    }
  }

  return [
    normalizeExperienceItem(
      {
        title: "",
        organization: "",
        period: "",
        description: trimmed,
        skills: "",
      },
      0
    ),
  ];
}

export function serializeExperiencePayload(items: ExperienceItem[]): string {
  const cleaned = items
    .map((item, index) => normalizeExperienceItem(item, index))
    .filter(
      (item) =>
        item.title ||
        item.organization ||
        item.period ||
        item.description ||
        item.skills
    );

  if (cleaned.length === 0) {
    return "";
  }

  return `${EXPERIENCE_STORAGE_PREFIX}${JSON.stringify(cleaned)}`;
}

