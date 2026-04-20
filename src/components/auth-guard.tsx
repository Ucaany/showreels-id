"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMockApp } from "@/hooks/use-mock-app";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { ready, session } = useMockApp();

  useEffect(() => {
    if (ready && !session) {
      router.replace("/auth/login");
    }
  }, [ready, session, router]);

  if (!ready || !session) {
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
