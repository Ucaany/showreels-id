"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMockApp } from "@/hooks/use-mock-app";
import { createClient } from "@/lib/supabase/client";
import { DEMO_MODE } from "@/lib/demo-mode";

/**
 * AuthGuard — Melindungi halaman yang memerlukan autentikasi.
 * Di production (non-demo), menggunakan Supabase session.
 * Di demo mode, menggunakan mock session dari MockAppProvider.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready: mockReady, session: mockSession } = useMockApp();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (DEMO_MODE) {
      // Demo mode: gunakan mock session
      if (mockReady && !mockSession) {
        router.replace("/auth/login");
      } else if (mockReady && mockSession) {
        setAuthenticated(true);
      }
      return;
    }

    // Production mode: cek Supabase session
    const supabase = createClient();
    if (!supabase) {
      // Supabase tidak dikonfigurasi — fallback ke mock
      if (mockReady && !mockSession) {
        router.replace("/auth/login");
      } else if (mockReady && mockSession) {
        setAuthenticated(true);
      }
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAuthenticated(true);
      } else {
        router.replace("/auth/login");
      }
    });
  }, [mockReady, mockSession, router]);

  // Tentukan apakah sudah siap
  const isReady = DEMO_MODE ? mockReady : authenticated !== null;
  const isAuthenticated = DEMO_MODE ? !!mockSession : authenticated === true;

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
