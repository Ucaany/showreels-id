"use client";

import { useCallback, useEffect, useState } from "react";

const AUTH_ATTEMPT_KEY = "showreels_auth_attempt_lock";
const MAX_FAILED_ATTEMPTS = 3;
const LOCK_DURATION_MS = 10 * 60 * 1000;

type AuthAttemptState = {
  failedAttempts: number;
  lockedUntil: number;
};

function readAttemptState(): AuthAttemptState {
  if (typeof window === "undefined") {
    return { failedAttempts: 0, lockedUntil: 0 };
  }

  const rawValue = window.localStorage.getItem(AUTH_ATTEMPT_KEY);
  if (!rawValue) {
    return { failedAttempts: 0, lockedUntil: 0 };
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<AuthAttemptState>;
    return {
      failedAttempts: Number(parsed.failedAttempts) || 0,
      lockedUntil: Number(parsed.lockedUntil) || 0,
    };
  } catch {
    return { failedAttempts: 0, lockedUntil: 0 };
  }
}

function writeAttemptState(state: AuthAttemptState) {
  window.localStorage.setItem(AUTH_ATTEMPT_KEY, JSON.stringify(state));
}

function formatRemainingTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function getLockMessage(lockedUntil: number) {
  return `Terlalu banyak percobaan gagal. Coba lagi dalam ${formatRemainingTime(
    lockedUntil - Date.now()
  )}.`;
}

export function useAuthAttemptLock() {
  const [attemptState, setAttemptState] = useState<AuthAttemptState>({
    failedAttempts: 0,
    lockedUntil: 0,
  });
  const [now, setNow] = useState(() => Date.now());

  const refreshState = useCallback(() => {
    const storedState = readAttemptState();

    if (storedState.lockedUntil && storedState.lockedUntil <= Date.now()) {
      window.localStorage.removeItem(AUTH_ATTEMPT_KEY);
      setAttemptState({ failedAttempts: 0, lockedUntil: 0 });
      return;
    }

    setAttemptState(storedState);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(refreshState, 0);

    const interval = window.setInterval(() => {
      setNow(Date.now());
      refreshState();
    }, 1000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [refreshState]);

  const lockedUntil =
    attemptState.lockedUntil > now ? attemptState.lockedUntil : 0;
  const isLocked = Boolean(lockedUntil);
  const lockMessage = lockedUntil ? getLockMessage(lockedUntil) : "";

  const registerFailure = useCallback(() => {
    const storedState = readAttemptState();

    if (storedState.lockedUntil && storedState.lockedUntil > Date.now()) {
      setAttemptState(storedState);
      return {
        isLocked: true,
        message: getLockMessage(storedState.lockedUntil),
      };
    }

    const failedAttempts = storedState.failedAttempts + 1;
    const nextState: AuthAttemptState =
      failedAttempts >= MAX_FAILED_ATTEMPTS
        ? {
            failedAttempts: 0,
            lockedUntil: Date.now() + LOCK_DURATION_MS,
          }
        : {
            failedAttempts,
            lockedUntil: 0,
          };

    writeAttemptState(nextState);
    setAttemptState(nextState);

    if (nextState.lockedUntil) {
      return {
        isLocked: true,
        message: getLockMessage(nextState.lockedUntil),
      };
    }

    return {
      isLocked: false,
      message: `Percobaan gagal ${failedAttempts}/${MAX_FAILED_ATTEMPTS}.`,
    };
  }, []);

  const clearFailures = useCallback(() => {
    window.localStorage.removeItem(AUTH_ATTEMPT_KEY);
    setAttemptState({ failedAttempts: 0, lockedUntil: 0 });
  }, []);

  return {
    isLocked,
    lockMessage,
    registerFailure,
    clearFailures,
  };
}
