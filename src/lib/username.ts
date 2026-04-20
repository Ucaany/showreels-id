import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export function sanitizeUsername(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
}

export async function ensureUniqueUsername(baseInput: string): Promise<string> {
  const base = sanitizeUsername(baseInput) || "creator";
  let candidate = base;
  let counter = 1;

  while (true) {
    const existing = await db.query.users.findFirst({
      where: eq(users.username, candidate),
      columns: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    counter += 1;
    candidate = `${base}_${counter}`;
  }
}
