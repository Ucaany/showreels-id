"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { SitePreferences } from "@/components/site-preferences";
import { Button } from "@/components/ui/button";

interface PublicMobileHeaderProps {
  ctaHref: string;
  ctaLabel: string;
}

export function PublicMobileHeader({ ctaHref, ctaLabel }: PublicMobileHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[#e2d9d3] bg-[#f7f4f1]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <AppLogo />
          <div className="hidden items-center gap-3 sm:flex">
            <SitePreferences />
            <Link href={ctaHref}>
              <Button variant="secondary">{ctaLabel}</Button>
            </Link>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#ddd3cd] bg-white text-[#201b18] sm:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 bg-[#1b1512]/35 sm:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full cursor-default"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu backdrop"
          />
          <div className="absolute right-0 top-0 h-full w-[88%] max-w-[360px] border-l border-[#ddd3cd] bg-[#f8f5f2] p-4 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <AppLogo />
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#ddd3cd] bg-white text-[#201b18]"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <SitePreferences />
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="secondary" className="w-full">Home</Button>
              </Link>
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="secondary" className="w-full">Dashboard</Button>
              </Link>
              <Link
                href="/dashboard/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block"
              >
                <Button variant="secondary" className="w-full">Profile</Button>
              </Link>
              <Link
                href="/dashboard/videos/new"
                onClick={() => setMobileMenuOpen(false)}
                className="block"
              >
                <Button variant="secondary" className="w-full">Submit Video</Button>
              </Link>
              <Link href={ctaHref} onClick={() => setMobileMenuOpen(false)} className="block">
                <Button className="w-full">{ctaLabel}</Button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
