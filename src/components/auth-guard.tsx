"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMockApp } from "@/hooks/use-mock-app";
import { DEMO_MODE } from "@/lib/demo-mode";

/**
 * AuthGuard — Melindungi halaman yang memerlukan autentikasi.
 * Di production (non-demo), menggunakan Auth.js session via useSession().
 * Di demo mode, menggunakan mock session dari MockAppProvider.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready: mockReady, session: mockSession } = useMockApp();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (DEMO_MODE) {
      // Demo mode: gunakan mock session
      if (mockReady && !mockSession) {
        router.replace("/auth/login");
      }
      return;
    }

    // Production mode: cek Auth.js session
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/auth/login");
    }
  }, [mockReady, mockSession, router, session, status]);

  // Tentukan apakah sudah siap
  const isReady = DEMO_MODE ? mockReady : status !== "loading";
  const isAuthenticated = DEMO_MODE
    ? !!mockSession
    : status === "authenticated" && Boolean(session?.user);

  if (!isReady || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600 shadow-card">
          Memuat sesi dashboard...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
