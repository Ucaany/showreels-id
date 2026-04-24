import Link from "next/link";

export default function LegalDpaPage() {
  return (
    <main className="min-h-screen bg-canvas px-4 py-10 sm:px-6 lg:px-8">
      <article className="mx-auto w-full max-w-3xl rounded-[1.5rem] border border-[#d9e3f7] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-eyebrow font-semibold uppercase text-[#2f66e4]">DPA</p>
        <h1 className="mt-2 text-[clamp(1.55rem,4vw,2.2rem)] font-extrabold tracking-[-0.03em] text-[#17120f]">
          Data Processing Addendum
        </h1>
        <p className="mt-4 text-body-base text-[#574b45]">
          Dokumen DPA ini menjelaskan tanggung jawab pemrosesan data antara Showreels
          dan pelanggan bisnis, termasuk batasan penggunaan data, keamanan, serta
          kebijakan penyimpanan.
        </p>
        <p className="mt-3 text-body-base text-[#574b45]">
          Untuk kebutuhan kerja sama enterprise atau agency, tim kami dapat
          menyediakan versi DPA lanjutan sesuai standar kepatuhan yang dibutuhkan.
        </p>
        <p className="mt-3 text-helper text-[#6d7d9f]">Terakhir diperbarui: 25 April 2026</p>

        <div className="mt-6">
          <Link href="/legal" className="text-[0.95rem] font-semibold text-[#2f66e4] hover:underline">
            Kembali ke Legal
          </Link>
        </div>
      </article>
    </main>
  );
}
