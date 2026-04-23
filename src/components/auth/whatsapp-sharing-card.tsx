import Link from "next/link";
import { ExternalLink, MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";

const WHATSAPP_SHARING_URL =
  "https://chat.whatsapp.com/JQfV8aJl36E8DCtZFazHEC?mode=gi_t";

export function WhatsappSharingCard({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.96),rgba(255,255,255,0.98))] shadow-sm",
        compact ? "mt-1 p-3" : "mt-5 p-4"
      )}
    >
      <div className={cn("flex items-start", compact ? "gap-2.5" : "gap-3")}>
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700",
            compact ? "h-9 w-9" : "h-10 w-10"
          )}
        >
          <MessageCircle className={cn(compact ? "h-4 w-4" : "h-5 w-5")} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">WhatsApp sharing</p>
          <p className={cn("text-xs leading-relaxed text-slate-600", compact ? "mt-0.5" : "mt-1")}>
            Gabung komunitas sharing creator untuk diskusi portfolio, peluang project,
            dan kolaborasi.
          </p>
        </div>
      </div>
      <Link
        href={WHATSAPP_SHARING_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50",
          compact ? "mt-2 h-10" : "mt-3 h-11"
        )}
      >
        Buka WhatsApp sharing
        <ExternalLink className="h-4 w-4" />
      </Link>
    </div>
  );
}
