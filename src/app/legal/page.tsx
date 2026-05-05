import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 sm:p-8 lg:p-10">
        <div className="max-w-3xl">
          <p className="text-eyebrow font-semibold uppercase text-[#1a46c9]">Legal</p>
          <h1 className="mt-3 font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.06] tracking-[-0.04em] text-slate-950">
            Halaman legal Showreels
          </h1>
          <p className="mt-4 text-body-lg text-slate-600">
            Dokumen legal berikut aktif dan bisa kamu akses kapan saja untuk melihat aturan
            penggunaan, privasi, serta pemrosesan data.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {legalLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:-translate-y-0.5 hover:border-[#dbe5ff] hover:bg-[#eef4ff] hover:shadow-md hover:shadow-[#1a46c9]/10 sm:px-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[1rem] font-extrabold tracking-[-0.02em] text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[0.9rem] leading-6 text-slate-600">
                    {item.description}
                  </p>
                </div>
                <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#1a46c9] ring-1 ring-[#dbe5ff] transition group-hover:bg-[#1a46c9] group-hover:text-white">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
