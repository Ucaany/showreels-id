import { hasPlaceholderEnvValue, normalizeEnvValue } from "@/lib/env-utils";

export function getDatabaseUrl() {
  return normalizeEnvValue(
    process.env.DATABASE_URL ||
      process.env.DATABASE_URL_MIGRATION
  );
}

export function isDatabaseUrlConfigured() {
  const connectionString = getDatabaseUrl();
  return (
    !hasPlaceholderEnvValue(connectionString) &&
    /^(postgres|postgresql):\/\//.test(connectionString)
  );
}
