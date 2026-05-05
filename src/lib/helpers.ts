export async function simulateDelay(duration = 500): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

export function formatDateLabel(dateISO: string): string {
  const date = new Date(dateISO);
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
