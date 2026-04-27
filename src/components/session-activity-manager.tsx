"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
const IDLE_CHECK_MS = 15 * 1000;
const LAST_ACTIVITY_KEY = "showreels:last-activity";

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
  const signingOutRef = useRef(false);
  const authenticatedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      return;
    }

    const forceSignOut = async () => {
      if (signingOutRef.current) {
        return;
      }

      signingOutRef.current = true;
      await supabase.auth.signOut();
      window.localStorage.removeItem(LAST_ACTIVITY_KEY);
      window.location.replace("/auth/login");
    };

    const ensureActiveSession = async (isAuthenticated: boolean) => {
      authenticatedRef.current = isAuthenticated;

      if (!isAuthenticated) {
        window.localStorage.removeItem(LAST_ACTIVITY_KEY);
        signingOutRef.current = false;
        return;
      }

      const lastActivity = readLastActivity();
      if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
        await forceSignOut();
        return;
      }

      writeLastActivity();
    };

    void supabase.auth.getUser().then(({ data }) => {
      void ensureActiveSession(Boolean(data.user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void ensureActiveSession(Boolean(session?.user));
    });

    const registerActivity = () => {
      writeLastActivity();
    };

    const interval = window.setInterval(() => {
      if (!authenticatedRef.current) {
        return;
      }

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
      if (document.visibilityState === "visible" && authenticatedRef.current) {
        void ensureActiveSession(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      window.clearInterval(interval);
      events.forEach((eventName) => {
        window.removeEventListener(eventName, registerActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
