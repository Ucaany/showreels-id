import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { sanitizeUsername } from "@/lib/username-rules";

export { USERNAME_REGEX, isReservedUsername, isUsernameFormatValid, sanitizeUsername } from "@/lib/username-rules";

export async function ensureUniqueUsername(baseInput: string): Promise<string> {
  const base = sanitizeUsername(baseInput) || "creator";
  const baseRoot = base.slice(0, 24) || "creator";
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
    candidate = `${baseRoot}-${counter}`.slice(0, 30);
  }
}
