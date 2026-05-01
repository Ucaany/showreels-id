"use client";

import Link from "next/link";
import { PencilLine } from "lucide-react";

export function OwnerEditButton() {
  return (
    <Link
      href="/dashboard/link-builder"
      className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#111111] text-white shadow-[0_14px_30px_rgba(17,17,17,0.3)] transition hover:scale-105 hover:bg-[#1E1E1E] focus:outline-none focus:ring-2 focus:ring-[#111111]/30 md:top-6 md:h-auto md:w-auto md:px-5 md:py-2.5"
    >
      <PencilLine className="h-6 w-6 md:mr-2 md:h-4 md:w-4" />
      <span className="hidden text-sm font-bold md:inline">Edit Tampilan</span>
    </Link>
  );
}