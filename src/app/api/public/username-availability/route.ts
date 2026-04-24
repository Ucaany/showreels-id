import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/db";
import { users } from "@/db/schema";
import { sanitizeUsername } from "@/lib/username";

function isUsernameFormatValid(value: string) {
  return /^[a-zA-Z0-9_]{3,24}$/.test(value.trim());
}

async function findSuggestion(base: string) {
  let counter = 2;
  let candidate = `${base}_${counter}`;

  while (counter <= 40) {
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

  return undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("username") ?? "";
  const sanitized = sanitizeUsername(input);

  if (!isUsernameFormatValid(input) || sanitized.length < 3) {
    return NextResponse.json({
      input,
      sanitized,
      available: false,
      reason: "invalid",
      suggestion: sanitized.length >= 3 ? sanitized : undefined,
    });
  }

  if (!isDatabaseConfigured) {
    return NextResponse.json({
      input,
      sanitized,
      available: false,
      reason: "idle",
    });
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.username, sanitized),
    columns: { id: true },
  });

  if (!existing) {
    return NextResponse.json({
      input,
      sanitized,
      available: true,
      reason: "available",
    });
  }

  return NextResponse.json({
    input,
    sanitized,
    available: false,
    reason: "taken",
    suggestion: await findSuggestion(sanitized),
  });
}
