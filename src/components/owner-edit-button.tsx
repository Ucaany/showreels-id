"use client";

import Link from "next/link";
import { PencilLine } from "lucide-react";

export function OwnerEditButton() {
  return (
    <>
      {/* Mobile: FAB di pojok kanan bawah */}
      <Link
        href="/dashboard/link-builder"
        className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#111111] !text-white shadow-[0_14px_30px_rgba(17,17,17,0.3)] transition hover:scale-105 hover:bg-[#1E1E1E] focus:outline-none focus:ring-2 focus:ring-[#111111]/30 md:hidden [&_svg]:!text-white"
      >
        <PencilLine className="h-5 w-5" />
      </Link>
      {/* Desktop: Button kecil di pojok kanan atas */}
      <Link
        href="/dashboard/link-builder"
        className="fixed right-6 top-6 z-50 hidden items-center gap-2 rounded-full bg-[#111111] px-4 py-2.5 text-sm font-bold !text-white shadow-[0_14px_30px_rgba(17,17,17,0.2)] transition hover:scale-105 hover:bg-[#1E1E1E] focus:outline-none focus:ring-2 focus:ring-[#111111]/30 md:inline-flex [&_svg]:!text-white"
      >
        <PencilLine className="h-4 w-4" />
        Edit Tampilan
      </Link>
    </>
  );
}