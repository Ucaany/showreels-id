import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const TOKEN_TTL_SECONDS = 10 * 60;
export const PASSWORD_RECOVERY_COOKIE = "videoport_pw_recovery";

type PasswordRecoveryPayload = {
  userId: string;
  username: string;
  iat: number;
  exp: number;
  nonce: string;
};

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getRecoverySecret() {
  const secret = process.env.PASSWORD_RECOVERY_SECRET?.trim();
  if (!secret) {
    throw new Error("PASSWORD_RECOVERY_SECRET is required.");
  }
  return secret;
}

function signPayload(encodedPayload: string) {
  const secret = getRecoverySecret();
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function createPasswordRecoveryToken(input: {
  userId: string;
  username: string;
}) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + TOKEN_TTL_SECONDS;
  const payload: PasswordRecoveryPayload = {
    userId: input.userId,
    username: input.username,
    iat,
    exp,
    nonce: randomBytes(12).toString("hex"),
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return {
    token: `${encodedPayload}.${signature}`,
    exp,
    maxAge: TOKEN_TTL_SECONDS,
  };
}

export function verifyPasswordRecoveryToken(token: string) {
  try {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) {
      return null;
    }

    const expectedSignature = signPayload(encodedPayload);
    const given = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);

    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      return null;
    }

    const parsed = JSON.parse(fromBase64Url(encodedPayload)) as PasswordRecoveryPayload;
    const now = Math.floor(Date.now() / 1000);

    if (!parsed?.userId || !parsed?.username || !parsed?.exp || parsed.exp < now) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}
