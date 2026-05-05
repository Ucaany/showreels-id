type ErrorLike = {
  code?: string;
  message?: string;
  cause?: unknown;
};

const BILLING_RELATIONS = [
  "billing_subscriptions",
  "billing_transactions",
  "creator_settings",
] as const;

function toErrorLike(value: unknown): ErrorLike | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as ErrorLike;
}

function getErrorCode(error: unknown): string {
  const direct = toErrorLike(error);
  const fromCause = toErrorLike(direct?.cause);
  return String(direct?.code || fromCause?.code || "");
}

function getErrorMessage(error: unknown): string {
  const direct = toErrorLike(error);
  const fromCause = toErrorLike(direct?.cause);

  return `${direct?.message || ""} ${fromCause?.message || ""}`
    .toLowerCase()
    .trim();
}

export function isRelationMissingError(error: unknown, relationName: string) {
  const code = getErrorCode(error);
  if (code === "42P01") {
    return true;
  }

  const message = getErrorMessage(error);
  return (
    message.includes("does not exist") &&
    message.includes(`relation "${relationName.toLowerCase()}"`)
  );
}

export function isMissingBillingSchemaError(error: unknown) {
  return BILLING_RELATIONS.some((relationName) =>
    isRelationMissingError(error, relationName)
  );
}
