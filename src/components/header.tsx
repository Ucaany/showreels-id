"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { navItems } from "@/lib/constants/landing";
import { AppLogo } from "@/components/app-logo";
import LanguageSwitch from "./landing-new/LanguageSwitch";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-white/70 backdrop-blur-xl shadow-sm"
          : "border-b border-transparent bg-white/0 backdrop-blur-md"
      }`}
    >
      <div className="container mx-auto max-w-[1180px] px-6">
        <nav className="flex h-[64px] items-center justify-between gap-3">
          <AppLogo />

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[13.5px] font-medium text-ink/70 transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitch />
            <Link
              href="/auth/login"
              className="hidden md:inline-flex h-10 items-center gap-1.5 rounded-full border border-ink/15 px-4 text-[13px] font-semibold text-ink/80 transition-all hover:-translate-y-0.5 hover:border-ink/30 hover:text-ink"
            >
              Login
            </Link>
            <Link
              href="#cta"
              className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-ink shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-0.5 hover:bg-white/90"
            >
              Mulai Gratis
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.4}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
