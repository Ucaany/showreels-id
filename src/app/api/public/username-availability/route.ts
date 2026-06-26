import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, isDatabaseConfigured } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/server/current-user";
import {
  isReservedUsername,
  isUsernameFormatValid,
  sanitizeUsername,
} from "@/lib/username-rules";
import {
  checkUsernameAvailabilityRateLimit,
  getClientIp,
  rateLimitExceededResponse,
} from "@/lib/rate-limit";

async function findSuggestion(base: string) {
  const suggestionBase = base.slice(0, 24) || "creator";
  let counter = 2;
  let candidate = `${suggestionBase}-${counter}`;

  while (counter <= 40) {
    const existing = await db.query.users.findFirst({
      where: eq(users.username, candidate),
      columns: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    counter += 1;
    candidate = `${suggestionBase}-${counter}`.slice(0, 30);
  }

  return undefined;
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = await checkUsernameAvailabilityRateLimit(ip);
  if (!rateLimit.success) {
    return rateLimitExceededResponse(rateLimit);
  }

  const { searchParams } = new URL(request.url);
  const input = searchParams.get("username") ?? searchParams.get("slug") ?? "";
  const allowCurrentUser = searchParams.get("current") === "1";
  const sanitized = sanitizeUsername(input);

  if (!isUsernameFormatValid(sanitized) || sanitized.length < 3) {
    return NextResponse.json({
      input,
      sanitized,
      available: false,
      reason: "invalid",
      suggestion: sanitized.length >= 3 ? sanitized : undefined,
    });
  }

  if (isReservedUsername(sanitized)) {
    return NextResponse.json({
      input,
      sanitized,
      available: false,
      reason: "reserved",
      suggestion: await findSuggestion(`${sanitized}-creator`),
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

  if (allowCurrentUser) {
    const currentUser = await getCurrentUser().catch(() => null);
    if (currentUser?.id === existing.id) {
      return NextResponse.json({
        input,
        sanitized,
        available: true,
        reason: "owned_by_current_user",
        ownedByCurrentUser: true,
      });
    }
  }

  return NextResponse.json({
    input,
    sanitized,
    available: false,
    reason: "taken",
    suggestion: await findSuggestion(sanitized),
  });
}
