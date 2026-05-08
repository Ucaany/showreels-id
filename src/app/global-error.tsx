"use client";

/**
 * Global Error Boundary — Menangkap error di root layout.
 * Ini adalah fallback terakhir jika layout.tsx sendiri yang crash.
 * Harus menyediakan <html> dan <body> sendiri karena layout tidak tersedia.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-white">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <div className="mx-auto max-w-md space-y-6">
            <div className="flex items-center justify-center">
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  borderRadius: "9999px",
                  padding: "1rem",
                }}
              >
                <svg
                  style={{ width: "2rem", height: "2rem", color: "#ef4444" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
            </div>

            <div>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  color: "#0f172a",
                  marginBottom: "0.5rem",
                }}
              >
                Kesalahan Sistem
              </h2>
              <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
                Terjadi kesalahan fatal pada aplikasi. Silakan muat ulang
                halaman atau kembali beberapa saat lagi.
              </p>
              {error.digest && (
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#94a3b8",
                    marginTop: "0.5rem",
                  }}
                >
                  Kode Error: {error.digest}
                </p>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "center",
              }}
            >
              <button
                onClick={reset}
                style={{
                  padding: "0.625rem 1.25rem",
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Muat Ulang
              </button>
              <a
                href="/"
                style={{
                  padding: "0.625rem 1.25rem",
                  backgroundColor: "#ffffff",
                  color: "#334155",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  border: "1px solid #e2e8f0",
                  textDecoration: "none",
                  cursor: "pointer",
                }}
              >
                Beranda
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
