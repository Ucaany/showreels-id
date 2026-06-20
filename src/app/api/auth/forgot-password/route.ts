import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { rateLimiters } from "@/lib/rate-limit";
import { queueEmail } from "@/lib/email";
import { isEmailConfigured } from "@/lib/email/resend-client";

export const dynamic = "force-dynamic";

const RESET_TTL_MINUTES = 30;
const RESET_TTL_MS = RESET_TTL_MINUTES * 60 * 1000;

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Format email belum valid."),
});

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function buildResetUrl(rawToken: string): string {
  const appOrigin =
    process.env.NEXT_PUBLIC_APP_URL || "https://showreels.id";
  return `${appOrigin.replace(/\/$/, "")}/auth/reset-password?token=${encodeURIComponent(
    rawToken
  )}`;
}

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured || !db) {
    return NextResponse.json(
      { code: "db_not_configured", error: "Layanan sedang tidak tersedia." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { code: "invalid_payload", error: "Permintaan tidak valid." },
      { status: 400 }
    );
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { code: "invalid_payload", error: firstIssue?.message || "Email tidak valid." },
      { status: 400 }
    );
  }

  const email = parsed.data.email;
  const rateLimit = rateLimiters.passwordReset(email);
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        code: "rate_limited",
        error: "Terlalu banyak percobaan. Coba lagi dalam beberapa menit.",
      },
      { status: 429 }
    );
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true, name: true, email: true, passwordHash: true },
  });

  if (user?.id) {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TTL_MS);

    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, user.id));

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expires: expiresAt,
    });

    if (isEmailConfigured()) {
      const resetUrl = buildResetUrl(rawToken);
      void queueEmail({
        userId: user.id,
        recipientEmail: user.email ?? email,
        template: {
          type: "password_reset",
          data: {
            userName: user.name || "Creator",
            resetUrl,
            expiresInMinutes: RESET_TTL_MINUTES,
          },
        },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
