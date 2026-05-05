const UNDEFINED_COLUMN_CODE = "42703";

function readNestedError(error: unknown): unknown {
  if (!error || typeof error !== "object") {
    return null;
  }

  return (error as { cause?: unknown }).cause ?? null;
}

function readErrorCode(error: unknown, depth = 0): string {
  if (!error || typeof error !== "object" || depth > 4) {
    return "";
  }

  const candidate = (error as { code?: unknown }).code;
  if (typeof candidate === "string") {
    return candidate;
  }

  return readErrorCode(readNestedError(error), depth + 1);
}

function readErrorMessage(error: unknown, depth = 0): string {
  if (!error || depth > 4) {
    return "";
  }

  const ownMessage =
    error instanceof Error
      ? error.message
      : typeof error === "object" && typeof (error as { message?: unknown }).message === "string"
        ? (error as { message: string }).message
        : "";

  const nestedMessage = readErrorMessage(readNestedError(error), depth + 1);
  return [ownMessage, nestedMessage].filter(Boolean).join(" ");
}

export function summarizeError(error: unknown) {
  return {
    code: readErrorCode(error) || undefined,
    message: readErrorMessage(error) || undefined,
  };
}

export function isCustomLinksSchemaError(error: unknown) {
  const code = readErrorCode(error);
  const message = readErrorMessage(error).toLowerCase();

  const mentionsColumn =
    message.includes("custom_links") ||
    message.includes('column "custom_links"') ||
    message.includes("users.custom_links");

  if (!mentionsColumn) {
    return false;
  }

  if (code === UNDEFINED_COLUMN_CODE) {
    return true;
  }

  return message.includes("does not exist");
}

export function isLinkedinSchemaError(error: unknown) {
  const code = readErrorCode(error);
  const message = readErrorMessage(error).toLowerCase();

  const mentionsColumn =
    message.includes("linkedin_url") ||
    message.includes('column "linkedin_url"') ||
    message.includes("users.linkedin_url");

  if (!mentionsColumn) {
    return false;
  }

  if (code === UNDEFINED_COLUMN_CODE) {
    return true;
  }

  return message.includes("does not exist");
}

export function isVideoPinSchemaError(error: unknown) {
  const code = readErrorCode(error);
  const message = readErrorMessage(error).toLowerCase();

  const mentionsColumn =
    message.includes("pinned_to_profile") ||
    message.includes("pinned_order") ||
    message.includes('column "pinned_to_profile"') ||
    message.includes('column "pinned_order"') ||
    message.includes("videos.pinned_to_profile") ||
    message.includes("videos.pinned_order");

  if (!mentionsColumn) {
    return false;
  }

  if (code === UNDEFINED_COLUMN_CODE) {
    return true;
  }

  return message.includes("does not exist");
}

export function isUsersSchemaMismatchError(error: unknown) {
  const code = readErrorCode(error);
  const message = readErrorMessage(error).toLowerCase();

  const isMissingColumnCode = code === UNDEFINED_COLUMN_CODE;
  const mentionsUsersTable =
    message.includes("users.") ||
    message.includes('relation "users"') ||
    message.includes('table "users"');
  const mentionsMissingColumn = message.includes("column") && message.includes("does not exist");

  if (isMissingColumnCode && mentionsUsersTable) {
    return true;
  }

  return mentionsUsersTable && mentionsMissingColumn;
}
