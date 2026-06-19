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

const BILLING_COLUMNS = [
  "checkout_url",
  "qr_url",
  "pay_code",
  "expired_at",
  "provider_reference",
  "payment_method",
  "description",
  "raw_payload",
  "paid_at",
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

export function isColumnMissingError(error: unknown) {
  const code = getErrorCode(error);
  if (code === "42703") {
    return true;
  }

  const message = getErrorMessage(error);
  return (
    message.includes("column") &&
    message.includes("does not exist")
  );
}

export function isMissingBillingSchemaError(error: unknown) {
  // Check if any billing table is missing
  const tableMissing = BILLING_RELATIONS.some((relationName) =>
    isRelationMissingError(error, relationName)
  );
  if (tableMissing) return true;

  // Check if a billing column is missing from an older checkout schema.
  if (isColumnMissingError(error)) {
    const message = getErrorMessage(error);
    // Only treat as billing schema error if it's a known billing column
    const isKnownBillingColumn = BILLING_COLUMNS.some((col) =>
      message.includes(col)
    );
    if (isKnownBillingColumn) return true;

    // Also catch generic column errors on billing tables
    const isBillingTable = BILLING_RELATIONS.some((rel) =>
      message.includes(rel)
    );
    if (isBillingTable) return true;
  }

  return false;
}
