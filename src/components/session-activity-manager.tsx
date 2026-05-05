"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const WARNING_TIMEOUT_MS = 10 * 60 * 1000;
const LOGOUT_TIMEOUT_MS = 15 * 60 * 1000;
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

function clearLastActivity() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(LAST_ACTIVITY_KEY);
}

async function refreshSessionRequest() {
  await fetch("/api/auth/refresh-session", { method: "POST" });
}

async function logoutRequest() {
  await fetch("/api/auth/logout", { method: "POST" });
}

export function SessionActivityManager() {
  const pathname = usePathname();
  const supabase = createClient();
  const signingOutRef = useRef(false);
  const authenticatedRef = useRef(false);
  const [warningVisible, setWarningVisible] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const isProtectedArea = useMemo(() => {
    return pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding");
  }, [pathname]);

  useEffect(() => {
    if (!isProtectedArea || !supabase || typeof window === "undefined") {
      return;
    }

    const forceSignOut = async () => {
      if (signingOutRef.current) {
        return;
      }

      signingOutRef.current = true;
      setWarningVisible(false);
      clearLastActivity();
      await logoutRequest().catch(() => null);
      await supabase.auth.signOut().catch(() => null);
      window.location.replace("/auth/login");
    };

    const ensureActiveSession = async (isAuthenticated: boolean) => {
      authenticatedRef.current = isAuthenticated;
      if (!isAuthenticated) {
        clearLastActivity();
        setWarningVisible(false);
        signingOutRef.current = false;
        return;
      }

      const idleDuration = Date.now() - readLastActivity();
      if (idleDuration >= LOGOUT_TIMEOUT_MS) {
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
      if (!authenticatedRef.current) return;
      writeLastActivity();
      setWarningVisible(false);
      setRemainingSeconds(0);
    };

    const interval = window.setInterval(() => {
      if (!authenticatedRef.current) {
        return;
      }

      const idleDuration = Date.now() - readLastActivity();
      if (idleDuration >= LOGOUT_TIMEOUT_MS) {
        void forceSignOut();
        return;
      }

      if (idleDuration >= WARNING_TIMEOUT_MS) {
        const remaining = Math.ceil((LOGOUT_TIMEOUT_MS - idleDuration) / 1000);
        setRemainingSeconds(Math.max(0, remaining));
        setWarningVisible(true);
      } else {
        setWarningVisible(false);
        setRemainingSeconds(0);
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
        registerActivity();
      }
    };

    const originalFetch = window.fetch.bind(window);
    window.fetch = (async (...args: Parameters<typeof fetch>) => {
      const response = await originalFetch(...args);
      if (authenticatedRef.current) {
        registerActivity();
      }
      return response;
    }) as typeof window.fetch;

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      window.clearInterval(interval);
      events.forEach((eventName) => {
        window.removeEventListener(eventName, registerActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.fetch = originalFetch;
    };
  }, [isProtectedArea, supabase]);

  if (!isProtectedArea || !warningVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[120] w-[min(92vw,360px)] rounded-2xl border border-amber-200 bg-white/95 p-4 shadow-[0_20px_48px_rgba(28,57,99,0.22)] backdrop-blur">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#1b2d4e]">Kamu masih di sini?</p>
          <p className="mt-1 text-xs leading-5 text-[#5a739d]">
            Kami akan logout otomatis jika tidak ada aktivitas. Sisa waktu sekitar{" "}
            <span className="font-semibold text-[#1f58e3]">{remainingSeconds}s</span>.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              className="h-9"
              onClick={async () => {
                writeLastActivity();
                setWarningVisible(false);
                setRemainingSeconds(0);
                await refreshSessionRequest().catch(() => null);
              }}
            >
              Tetap masuk
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-9"
              onClick={async () => {
                clearLastActivity();
                await logoutRequest().catch(() => null);
                await supabase?.auth.signOut().catch(() => null);
                window.location.replace("/auth/login");
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
