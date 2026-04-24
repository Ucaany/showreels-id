import Link from "next/link";

const legalLinks = [
  {
    title: "Syarat",
    href: "/legal/syarat",
    description: "Ketentuan penggunaan platform Showreels.",
  },
  {
    title: "Privasi",
    href: "/legal/privasi",
    description: "Cara kami memproses dan melindungi data pengguna.",
  },
  {
    title: "Cookies",
    href: "/legal/cookies",
    description: "Informasi penggunaan cookies dan pelacakan dasar situs.",
  },
  {
    title: "DPA",
    href: "/legal/dpa",
    description: "Data Processing Addendum untuk kebutuhan bisnis.",
  },
];

export default function LegalPage() {
  return (
    <main className="min-h-screen bg-canvas px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl rounded-[1.5rem] border border-[#d9e3f7] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-eyebrow font-semibold uppercase text-[#2f66e4]">Legal</p>
        <h1 className="mt-2 text-[clamp(1.65rem,4.2vw,2.3rem)] font-extrabold tracking-[-0.03em] text-[#17120f]">
          Halaman legal Showreels
        </h1>
        <p className="mt-3 text-body-base text-[#5a4e48]">
          Dokumen legal berikut aktif dan bisa kamu akses kapan saja untuk melihat
          aturan penggunaan, privasi, serta pemrosesan data.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {legalLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[1rem] border border-[#d8e4ff] bg-[#f5f9ff] px-4 py-3 transition hover:border-[#b8ceff] hover:bg-[#ecf3ff]"
            >
              <p className="text-[1rem] font-bold text-[#1c2b45]">{item.title}</p>
              <p className="mt-1 text-[0.9rem] text-[#4d5e7f]">{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
