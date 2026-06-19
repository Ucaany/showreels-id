import { footerColumns } from "@/lib/constants/landing";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-borderSoft pt-18 pb-10">
      <div className="container mx-auto max-w-[1180px] px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[2fr_repeat(4,1fr)]">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="h-7 w-7 rounded-lg bg-accent flex items-center justify-center">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold">showreels.id</span>
            </Link>
            <p className="text-sm leading-relaxed text-text-secondary max-w-xs">
              Platform portofolio video dari berbagai platform dalam satu halaman.
            </p>
            <div className="mt-6 flex gap-4">
              {["Instagram", "YouTube", "TikTok", "Vimeo"].map((social) => (
                <Link
                  key={social}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white transition-all hover:border-text-muted hover:-translate-y-0.5"
                  aria-label={social}
                >
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10z" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Produk */}
          <div>
            <h4 className="mb-4 text-sm font-bold text-text-primary">Produk</h4>
            <ul className="space-y-3">
              {footerColumns.produk.map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Perusahaan */}
          <div>
            <h4 className="mb-4 text-sm font-bold text-text-primary">
              Perusahaan
            </h4>
            <ul className="space-y-3">
              {footerColumns.perusahaan.map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Bantuan */}
          <div>
            <h4 className="mb-4 text-sm font-bold text-text-primary">Bantuan</h4>
            <ul className="space-y-3">
              {footerColumns.bantuan.map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-sm font-bold text-text-primary">Legal</h4>
            <ul className="space-y-3">
              {footerColumns.legal.map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-borderSoft pt-8 text-center text-sm text-text-muted">
          © 2024 showreels.id. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
