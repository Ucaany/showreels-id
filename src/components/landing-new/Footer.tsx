"use client";

import Link from "next/link";
import { AppLogo } from "@/components/app-logo";
import { useLang } from "@/lib/i18n/landing-context";
import { footerEN } from "@/lib/constants/landing-en";

const columnsID = [
  {
    title: "PRODUK",
    items: [
      { label: "Fitur", href: "#fitur" },
      { label: "Harga", href: "#harga" },
      { label: "Template", href: "#" },
      { label: "Integrasi", href: "#" },
    ],
  },
  {
    title: "PERUSAHAAN",
    items: [
      { label: "Tentang Kami", href: "/about" },
      { label: "Blog", href: "#" },
      { label: "Karir", href: "#" },
      { label: "Kontak", href: "/customer-service" },
    ],
  },
  {
    title: "BANTUAN",
    items: [
      { label: "FAQ", href: "#faq" },
      { label: "Pusat Bantuan", href: "/customer-service" },
      { label: "Panduan", href: "#" },
      { label: "Kebijakan Privasi", href: "/legal/privasi" },
    ],
  },
  {
    title: "LEGAL",
    items: [
      { label: "Privasi", href: "/legal/privasi" },
      { label: "Syarat & Ketentuan", href: "/legal/syarat" },
      { label: "Cookies", href: "/legal/cookies" },
      { label: "DPA", href: "/legal/dpa" },
    ],
  },
];

const columnsEN = [
  {
    title: footerEN.columns.product.heading,
    items: [
      { label: "Features", href: "#fitur" },
      { label: "Pricing", href: "#harga" },
      { label: "Templates", href: "#" },
      { label: "Integrations", href: "#" },
    ],
  },
  {
    title: footerEN.columns.company.heading,
    items: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "/customer-service" },
    ],
  },
  {
    title: footerEN.columns.help.heading,
    items: [
      { label: "FAQ", href: "#faq" },
      { label: "Help Center", href: "/customer-service" },
      { label: "Guides", href: "#" },
      { label: "Privacy Policy", href: "/legal/privasi" },
    ],
  },
  {
    title: footerEN.columns.legal.heading,
    items: [
      { label: "Privacy", href: "/legal/privasi" },
      { label: "Terms", href: "/legal/syarat" },
      { label: "Cookies", href: "/legal/cookies" },
      { label: "DPA", href: "/legal/dpa" },
    ],
  },
];

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group inline-flex h-9 w-9 items-center justify-center rounded-full text-ink/55 transition-all duration-200 hover:-translate-y-0.5 hover:bg-ink/[0.04] hover:text-ink/90"
    >
      {children}
    </a>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="footer-ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FEDA77" />
          <stop offset="25%" stopColor="#F58529" />
          <stop offset="50%" stopColor="#DD2A7B" />
          <stop offset="75%" stopColor="#8134AF" />
          <stop offset="100%" stopColor="#515BD4" />
        </linearGradient>
      </defs>
      <path fill="url(#footer-ig-gradient)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="currentColor" d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.78 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.745-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.32.143 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221z" />
    </svg>
  );
}

function TiktokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 33 33" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g>
        <path fill="#FF004F" d="M25.59 11.69a4.83 4.83 0 0 1-3.77-4.25V7h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V14.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 11.8 25.1a6.34 6.34 0 0 0 10.86-4.43V13.65a8.16 8.16 0 0 0 4.77 1.52V11.7a4.85 4.85 0 0 1-1.84-.01z" transform="translate(1.5 1.5)" />
        <path fill="#00F2EA" d="M25.59 11.69a4.83 4.83 0 0 1-3.77-4.25V7h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V14.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 11.8 25.1a6.34 6.34 0 0 0 10.86-4.43V13.65a8.16 8.16 0 0 0 4.77 1.52V11.7a4.85 4.85 0 0 1-1.84-.01z" transform="translate(-1.5 -1.5)" />
        <path fill="#000" d="M25.59 11.69a4.83 4.83 0 0 1-3.77-4.25V7h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V14.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 11.8 25.1a6.34 6.34 0 0 0 10.86-4.43V13.65a8.16 8.16 0 0 0 4.77 1.52V11.7a4.85 4.85 0 0 1-1.84-.01z" />
      </g>
    </svg>
  );
}

export default function Footer() {
  const { lang } = useLang();
  const isEN = lang === "EN";
  const columns = isEN ? columnsEN : columnsID;

  return (
    <footer className="border-t border-[color:var(--border)] bg-white py-10">
      <div className="container mx-auto max-w-[1180px] px-6">
        <div className="grid gap-8 md:grid-cols-6">
          <div className="md:col-span-2">
            <AppLogo />
            <p className="mt-3 max-w-[280px] text-[12.5px] font-normal leading-relaxed text-ink/60">
              {isEN
                ? footerEN.tagline
                : "Portofolio video dari banyak platform dalam satu link."}
            </p>

            <div className="mt-6">
              <h4 className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink/45">
                {isEN ? "Follow Us" : "Ikuti Kami"}
              </h4>
              <div className="flex items-center gap-1.5">
                <SocialLink href="https://instagram.com/showreels.id" label="Instagram">
                  <InstagramIcon className="h-[18px] w-[18px]" />
                </SocialLink>
                <SocialLink href="https://www.threads.net/@showreels.id" label="Threads">
                  <ThreadsIcon className="h-[17px] w-[17px]" />
                </SocialLink>
                <SocialLink href="https://www.tiktok.com/@showreels.id" label="TikTok">
                  <TiktokIcon className="h-[17px] w-[17px]" />
                </SocialLink>
              </div>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink/45">
                {col.title}
              </h4>
              <ul className="space-y-1.5">
                {col.items.map((it) => (
                  <li key={it.label}>
                    <Link
                      href={it.href}
                      className="text-[12.5px] font-medium text-ink/75 transition-colors hover:text-brand-600"
                    >
                      {it.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-[color:var(--border)] pt-5 text-[11.5px] font-medium text-ink/55 md:flex-row md:items-center">
          <p>
            {isEN ? footerEN.copyright : "© 2025 showreels.id. Hak cipta dilindungi."}
          </p>
          <p className="inline-flex items-center gap-1.5">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-brand-500 animate-live-dot" />
            {isEN ? footerEN.status : "Semua sistem berjalan normal"}
          </p>
        </div>
      </div>
    </footer>
  );
}
