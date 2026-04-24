import Link from "next/link";

export default function LegalCookiesPage() {
  return (
    <main className="min-h-screen bg-canvas px-4 py-10 sm:px-6 lg:px-8">
      <article className="mx-auto w-full max-w-3xl rounded-[1.5rem] border border-[#d9e3f7] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-eyebrow font-semibold uppercase text-[#2f66e4]">Cookies</p>
        <h1 className="mt-2 text-[clamp(1.55rem,4vw,2.2rem)] font-extrabold tracking-[-0.03em] text-[#17120f]">
          Kebijakan Cookies
        </h1>
        <p className="mt-4 text-body-base text-[#574b45]">
          Cookies digunakan untuk menjaga sesi login, preferensi bahasa, dan
          meningkatkan performa halaman publik Showreels. Kami tidak menggunakan
          cookies untuk praktik pelacakan yang melanggar privasi pengguna.
        </p>
        <p className="mt-3 text-body-base text-[#574b45]">
          Kamu dapat mengelola cookies melalui pengaturan browser. Menonaktifkan
          cookies tertentu dapat memengaruhi kenyamanan penggunaan fitur.
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
