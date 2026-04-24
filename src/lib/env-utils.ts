function stripWrappingQuotes(value: string) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

export function normalizeEnvValue(value?: string | null) {
  return stripWrappingQuotes(value ?? "");
}

export function hasPlaceholderEnvValue(value?: string | null) {
  const normalized = normalizeEnvValue(value);
  return !normalized || normalized.includes("<") || normalized.includes(">");
}
