"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard Error Boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto max-w-md space-y-5">
        <div className="flex items-center justify-center">
          <div className="rounded-full bg-amber-50 p-3">
            <svg
              className="h-6 w-6 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold text-slate-900">
            Gagal Memuat Dashboard
          </h2>
          <p className="text-sm text-slate-500">
            Terjadi kesalahan saat memuat halaman ini. Silakan coba lagi atau
            kembali ke halaman utama dashboard.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400">
              Ref: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Coba Lagi
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
