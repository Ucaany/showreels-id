const UNDEFINED_COLUMN_CODE = "42703";

function readErrorCode(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "";
  }

  const candidate = (error as { code?: unknown }).code;
  return typeof candidate === "string" ? candidate : "";
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (!error || typeof error !== "object") {
    return "";
  }

  const candidate = (error as { message?: unknown }).message;
  return typeof candidate === "string" ? candidate : "";
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
