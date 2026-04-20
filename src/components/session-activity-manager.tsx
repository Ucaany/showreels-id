"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const IDLE_CHECK_MS = 15 * 1000;
const LAST_ACTIVITY_KEY = "videoport:last-activity";

function readLastActivity(): number {
  if (typeof window === "undefined") {
    return Date.now();
  }

  const stored = window.localStorage.getItem(LAST_ACTIVITY_KEY);
  const parsed = Number(stored);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Date.now();
}

function writeLastActivity() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
}

export function SessionActivityManager() {
  const { status } = useSession();
  const signingOutRef = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated" && typeof window !== "undefined") {
      window.localStorage.removeItem(LAST_ACTIVITY_KEY);
      signingOutRef.current = false;
    }
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || typeof window === "undefined") {
      return;
    }

    const forceSignOut = async () => {
      if (signingOutRef.current) {
        return;
      }

      signingOutRef.current = true;
      await signOut({ callbackUrl: "/auth/login" });
    };

    const ensureActiveSession = async () => {
      const lastActivity = readLastActivity();
      if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
        await forceSignOut();
        return;
      }

      writeLastActivity();
    };

    void ensureActiveSession();

    const registerActivity = () => {
      writeLastActivity();
    };

    const interval = window.setInterval(() => {
      const lastActivity = readLastActivity();
      if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
        void forceSignOut();
      }
    }, IDLE_CHECK_MS);

    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "scroll",
      "touchstart",
      "focus",
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, registerActivity, { passive: true });
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void ensureActiveSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      events.forEach((eventName) => {
        window.removeEventListener(eventName, registerActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [status]);

  return null;
}
