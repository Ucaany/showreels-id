import Link from "next/link";
import { ExternalLink, MessageCircle } from "lucide-react";

const WHATSAPP_SHARING_URL =
  "https://chat.whatsapp.com/JQfV8aJl36E8DCtZFazHEC?mode=gi_t";

export function WhatsappSharingCard() {
  return (
    <div className="mt-5 rounded-2xl border border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.96),rgba(255,255,255,0.98))] p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <MessageCircle className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">WhatsApp sharing</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            Gabung komunitas sharing creator untuk diskusi portfolio, peluang project,
            dan kolaborasi.
          </p>
        </div>
      </div>
      <Link
        href={WHATSAPP_SHARING_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50"
      >
        Buka WhatsApp sharing
        <ExternalLink className="h-4 w-4" />
      </Link>
    </div>
  );
}
