import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type DbUser } from "@/db/schema";
import { verifyPassword } from "@/lib/password";

export const MAX_LOGIN_ATTEMPTS = 3;
export const LOGIN_LOCK_MINUTES = 15;
export const PASSWORD_RESET_MINUTES = 30;

const LOGIN_LOCK_MS = LOGIN_LOCK_MINUTES * 60 * 1000;
const PASSWORD_RESET_MS = PASSWORD_RESET_MINUTES * 60 * 1000;

export function createPasswordResetToken() {
  return `${crypto.randomUUID()}-${crypto.randomUUID()}`;
}

export function createPasswordResetExpiry() {
  return new Date(Date.now() + PASSWORD_RESET_MS);
}

export function getRemainingLockMinutes(lockedUntil: Date) {
  return Math.max(
    1,
    Math.ceil((lockedUntil.getTime() - Date.now()) / (60 * 1000))
  );
}

export async function getUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}

export async function resetLoginAttempts(userId: string) {
  await db
    .update(users)
    .set({
      failedLoginAttempts: 0,
      loginLockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}

export async function registerFailedLogin(user: DbUser) {
  const nextAttempts = user.failedLoginAttempts + 1;
  const shouldLock = nextAttempts >= MAX_LOGIN_ATTEMPTS;
  const lockUntil = shouldLock ? new Date(Date.now() + LOGIN_LOCK_MS) : null;

  await db
    .update(users)
    .set({
      failedLoginAttempts: shouldLock ? 0 : nextAttempts,
      loginLockedUntil: lockUntil,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  return {
    locked: shouldLock,
    lockUntil,
    attemptsLeft: shouldLock ? 0 : MAX_LOGIN_ATTEMPTS - nextAttempts,
  };
}

export async function validateCredentialsAttempt(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await getUserByEmail(normalizedEmail);

  if (!user?.passwordHash) {
    return {
      ok: false as const,
      code: "invalid_credentials" as const,
      error: "Email atau password tidak cocok.",
    };
  }

  if (user.loginLockedUntil && user.loginLockedUntil.getTime() > Date.now()) {
    return {
      ok: false as const,
      code: "login_locked" as const,
      error: `Terlalu banyak percobaan login. Coba lagi dalam ${getRemainingLockMinutes(
        user.loginLockedUntil
      )} menit.`,
    };
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    const failed = await registerFailedLogin(user);
    if (failed.locked && failed.lockUntil) {
      return {
        ok: false as const,
        code: "login_locked" as const,
        error: `Login dikunci selama ${LOGIN_LOCK_MINUTES} menit karena 3 kali percobaan gagal.`,
      };
    }

    return {
      ok: false as const,
      code: "invalid_credentials" as const,
      error: `Email atau password tidak cocok. Sisa percobaan: ${failed.attemptsLeft}.`,
    };
  }

  await resetLoginAttempts(user.id);
  return { ok: true as const, user };
}
