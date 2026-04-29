import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LegalPrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <article className="mx-auto w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8 lg:p-10">
        <p className="text-eyebrow font-semibold uppercase text-[#1a46c9]">Privasi</p>
        <h1 className="mt-3 font-display text-[clamp(1.8rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.04em] text-slate-950">
          Kebijakan Privasi Showreels
        </h1>
        <div className="mt-6 space-y-4 text-body-base leading-7 text-slate-600">
          <p>
            Showreels mengumpulkan data minimum untuk menjalankan akun creator,
            pengelolaan profil publik, dan publikasi halaman video. Data sensitif tidak
            dibagikan ke pihak ketiga tanpa dasar hukum yang jelas.
          </p>
          <p>
            Pengguna dapat memperbarui informasi profil dari dashboard, serta mengatur
            status visibilitas konten sesuai kebutuhan publik, private, atau semi private.
          </p>
        </div>
        <p className="mt-5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-helper text-slate-500">
          Terakhir diperbarui: 25 April 2026
        </p>

        <div className="mt-7">
          <Link href="/legal" className="inline-flex items-center gap-2 text-[0.95rem] font-semibold text-[#1a46c9] hover:text-[#153aa8]">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Legal
          </Link>
        </div>
      </article>
    </main>
  );
}
