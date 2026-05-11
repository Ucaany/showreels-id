export async function simulateDelay(duration = 500): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

/**
 * Safely converts Date | string to ISO string.
 * Prevents runtime error when calling .toISOString() on string values.
 */
export function toSafeISOString(value: Date | string | null | undefined): string {
  if (!value) {
    return new Date().toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return value.toISOString();
}

export function formatDateLabel(dateISO: string | Date): string {
  const date = typeof dateISO === "string" ? new Date(dateISO) : dateISO;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID().slice(0, 10)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 12)}`;
}
