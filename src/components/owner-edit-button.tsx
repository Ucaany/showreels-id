"use client";

import Link from "next/link";
import { PencilLine } from "lucide-react";

export function OwnerEditButton() {
  return (
    <Link
      href="/dashboard/link-builder"
      className="fixed right-4 top-4 z-50 inline-flex items-center gap-2 rounded-full bg-[#111111] px-4 py-2.5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(17,17,17,0.2)] transition hover:bg-[#1E1E1E] hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#111111]/30 sm:right-6 sm:top-6"
    >
      <PencilLine className="h-4 w-4" />
      Edit Tampilan
    </Link>
  );
}