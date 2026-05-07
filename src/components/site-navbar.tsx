"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { AvatarBadge } from "@/components/avatar-badge";
import { Button } from "@/components/ui/button";

type SiteNavbarProps = {
  currentUser?: {
    name: string | null;
    username: string | null;
    image: string | null;
    email: string;
  } | null;
};

export function SiteNavbar({ currentUser }: SiteNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-[70] border-b border-slate-200 bg-white/92 backdrop-blur">
      <div className="mx-auto flex min-h-[4.55rem] w-full max-w-[1160px] items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
        <Link href="/">
          <AppLogo />
        </Link>

        <div className="hidden items-center gap-2.5 lg:flex">
          {currentUser ? (
            <>
              <Link
                href="/dashboard"
                className="inline-flex min-h-11 items-center px-2 text-[0.95rem] font-semibold tracking-[-0.012em] text-black transition hover:text-slate-950"
              >
                Dashboard
              </Link>
              <div className="inline-flex min-h-11 items-center px-1">
                <AvatarBadge
                  name={currentUser.name || "Creator"}
                  avatarUrl={currentUser.image || ""}
                  size="sm"
                />
              </div>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="inline-flex min-h-11 items-center px-2 text-[0.95rem] font-semibold tracking-[-0.012em] text-black transition hover:text-slate-950"
              >
                Masuk
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="bg-[#1a46c9] hover:bg-[#153a9f]">
                  Daftar
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-900 lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="mx-auto max-w-[1160px] space-y-1 px-4 py-4 sm:px-6">
            {currentUser ? (
              <>
                <Link
                  href="/dashboard"
                  className="block rounded-lg px-3 py-2 text-base font-semibold text-slate-900 hover:bg-slate-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-2 px-3 py-2">
                  <AvatarBadge
                    name={currentUser.name || "Creator"}
                    avatarUrl={currentUser.image || ""}
                    size="sm"
                  />
                  <span className="text-sm text-slate-600">{currentUser.email}</span>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block rounded-lg px-3 py-2 text-base font-semibold text-slate-900 hover:bg-slate-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/signup"
                  className="block rounded-lg px-3 py-2 text-base font-semibold text-slate-900 hover:bg-slate-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
