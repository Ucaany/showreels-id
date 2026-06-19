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
    <header className="fixed left-0 right-0 top-0 z-[70] overflow-x-hidden border-b border-slate-200 bg-white/92 backdrop-blur">
      <div className="mx-auto flex min-h-[4.55rem] w-full max-w-[1160px] items-center justify-between gap-3 px-4 py-2.5 sm:gap-4 sm:px-6 lg:px-8">
        <AppLogo className="max-w-[calc(100vw-5.5rem)]" />

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
              <Link href="/auth/login">
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
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
          <div className="mx-auto max-h-[calc(100dvh-4.55rem)] max-w-[1160px] space-y-1 overflow-y-auto px-4 py-4 sm:px-6">
            {currentUser ? (
              <>
                <Link
                  href="/dashboard"
                  className="block rounded-lg px-3 py-2 text-base font-semibold text-slate-900 hover:bg-slate-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <div className="flex min-w-0 items-center gap-2 px-3 py-2">
                  <AvatarBadge
                    name={currentUser.name || "Creator"}
                    avatarUrl={currentUser.image || ""}
                    size="sm"
                  />
                  <span className="min-w-0 truncate text-sm text-slate-600">
                    {currentUser.email}
                  </span>
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
                  href="/auth/login"
                  className="block rounded-lg bg-orange-600 px-3 py-2 text-center text-base font-semibold text-white hover:bg-orange-700"
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
