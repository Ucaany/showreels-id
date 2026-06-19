import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex items-center justify-center">
          <span className="text-6xl font-bold text-slate-200">404</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-sm text-slate-500">
            Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
            Pastikan URL yang Anda masukkan sudah benar.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Kembali ke Beranda
          </Link>
          <Link
            href="/customer-service"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Hubungi Bantuan
          </Link>
        </div>
      </div>
    </div>
  );
}
