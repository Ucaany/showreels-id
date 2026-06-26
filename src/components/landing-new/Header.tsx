"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { navItems } from "@/lib/constants/landing";
import { navItemsEN } from "@/lib/constants/landing-en";
import { AppLogo } from "@/components/app-logo";
import { AvatarBadge } from "@/components/avatar-badge";
import { useLang } from "@/lib/i18n/landing-context";
import LanguageSwitch from "./LanguageSwitch";

export default function Header({ hideNav = false }: { hideNav?: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang } = useLang();
  const { data: session, status } = useSession();
  const nav = lang === "EN" ? navItemsEN : navItems;
  const isAuth = status === "authenticated" && !!session?.user;

  // Lock body scroll when sidebar is open
  useEffect(() => {
    if (menuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [menuOpen]);

  // Close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Auto-close on resize to desktop
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-40 w-full bg-white border-b border-black/[0.06]"
      >
        <div className="container mx-auto max-w-[1180px] px-5 sm:px-6">
          <nav className="flex h-[64px] items-center justify-between gap-3">
            <AppLogo />

            {/* Desktop nav (>= lg) */}
            {!hideNav && (
              <div className="hidden lg:flex items-center gap-7">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-[13.5px] font-medium text-ink/70 transition-colors hover:text-ink"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Desktop: language + auth actions */}
              <div className="hidden lg:flex items-center gap-2 sm:gap-3">
                <LanguageSwitch />
                {isAuth ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center"
                    aria-label="Dashboard"
                  >
                    <AvatarBadge
                      name={session?.user?.name || "Creator"}
                      avatarUrl={session?.user?.image || undefined}
                      size="sm"
                    />
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    className="inline-flex h-10 items-center gap-1.5 rounded-full border border-ink/15 bg-white/60 px-4 text-[13px] font-semibold text-ink shadow-[0_2px_10px_rgba(0,0,0,0.06)] backdrop-blur-md transition-all hover:border-ink/25 hover:bg-white/80 hover:-translate-y-px"
                  >
                    {lang === "EN" ? "Get Started" : "Mulai Gratis"}
                  </Link>
                )}
              </div>

              {/* Hamburger: visible below lg */}
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-transparent text-ink/80 transition-all hover:border-ink/25 hover:text-ink"
              >
                <Menu className="h-[18px] w-[18px]" strokeWidth={2.2} />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Sidebar (tablet & mobile) */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={closeMenu}
              className="fixed inset-0 z-50 bg-ink/35 backdrop-blur-sm"
              aria-hidden
            />

            {/* Drawer */}
            <motion.aside
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", ease: [0.32, 0.72, 0, 1], duration: 0.32 }}
              className="fixed right-0 top-0 z-50 flex h-full w-[min(340px,86vw)] flex-col bg-white shadow-[-24px_0_60px_rgba(10,13,20,0.18)]"
            >
              {/* Drawer header */}
              <div className="flex h-[64px] items-center justify-between border-b border-black/[0.06] px-5">
                <AppLogo />
                <button
                  type="button"
                  onClick={closeMenu}
                  aria-label="Close menu"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink/70 transition-all hover:border-ink/25 hover:text-ink"
                >
                  <X className="h-4 w-4" strokeWidth={2.2} />
                </button>
              </div>

              {/* Nav links */}
              {!hideNav && (
                <nav className="flex-1 overflow-y-auto px-3 py-4">
                  <p className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink/35">
                    {lang === "EN" ? "Menu" : "Menu"}
                  </p>
                  <ul className="flex flex-col">
                    {nav.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={closeMenu}
                          className="flex items-center justify-between rounded-xl px-3 py-3 text-[15px] font-semibold text-ink/85 transition-colors hover:bg-brand-50/70 hover:text-ink"
                        >
                          <span>{item.label}</span>
                          <svg
                            className="h-3.5 w-3.5 text-ink/30"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}

              {/* Footer actions */}
              <div className="border-t border-black/[0.06] px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink/35">
                    {lang === "EN" ? "Language" : "Bahasa"}
                  </p>
                  <LanguageSwitch />
                </div>

                {isAuth ? (
                  <Link
                    href="/dashboard"
                    onClick={closeMenu}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-50 text-[13.5px] font-semibold text-ink transition-all hover:bg-brand-100"
                  >
                    <AvatarBadge
                      name={session?.user?.name || "Creator"}
                      avatarUrl={session?.user?.image || undefined}
                      size="sm"
                    />
                    {lang === "EN" ? "Dashboard" : "Dashboard"}
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={closeMenu}
                    className="flex h-11 w-full items-center justify-center text-[13.5px] font-semibold text-ink"
                  >
                    {lang === "EN" ? "Get Started" : "Mulai Gratis"}
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
